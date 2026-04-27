const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

app.options('*', cors({ origin: "*" }));

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: false
  },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

const db = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306
});

const rooms = new Map();

db.getConnection()
  .then(() => console.log('✅ Database connected!'))
  .catch(err => console.error('❌ Database error:', err.message));

app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'Werewolf Server Running!' });
});

io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  socket.on('createRoom', async (data) => {
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const [result] = await db.execute(
        'INSERT INTO rooms (room_code, name, max_players) VALUES (?, ?, ?)',
        [roomCode, data.roomName, data.maxPlayers || 12]
      );
      rooms.set(roomCode, {
        id: result.insertId,
        code: roomCode,
        name: data.roomName,
        maxPlayers: data.maxPlayers || 12,
        players: [],
        phase: 'lobby',
        votes: {},
        nightActions: {},
        dayCount: 1
      });
      socket.emit('roomCreated', { roomCode });
      console.log('🏠 Room created:', roomCode);
    } catch (error) {
      console.error('Error createRoom:', error);
      socket.emit('gameError', { message: error.message });
    }
  });

  socket.on('joinRoom', ({ roomCode, username }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('gameError', { message: 'Room not found!' });
    if (room.players.length >= room.maxPlayers) return socket.emit('gameError', { message: 'Room full!' });
    if (room.phase !== 'lobby') return socket.emit('gameError', { message: 'Game already started!' });

    const player = {
      id: socket.id,
      username,
      role: null,
      isAlive: true,
      isHost: room.players.length === 0
    };

    room.players.push(player);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;

    broadcastPlayers(roomCode);
    socket.emit('roomJoined', { roomCode });
    console.log(`👤 ${username} joined ${roomCode}`);
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.players.length < 3) {
      return socket.emit('gameError', { message: 'Need at least 3 players!' });
    }

    const roles = assignRoles(room.players.length);
    room.players.forEach((p, i) => p.role = roles[i]);
    room.phase = 'night';
    room.nightActions = {};
    room.votes = {};

    io.to(roomCode).emit('gameStarted', {
      players: getPublicPlayers(room),
      phase: 'night',
      dayCount: room.dayCount
    });

    room.players.forEach(p => {
      const teammates = p.role === 'werewolf'
        ? room.players.filter(x => x.role === 'werewolf' && x.id !== p.id).map(x => x.username)
        : [];
      io.to(p.id).emit('yourRole', { role: p.role, teammates });
    });

    broadcastChat(roomCode, '🎮 Game started! Night falls...', 'system');
    startNightPhase(roomCode);
  });

  socket.on('nightAction', ({ roomCode, targetUsername }) => {
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'night') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive) return;

    room.nightActions[player.role] = room.nightActions[player.role] || {};
    room.nightActions[player.role][player.username] = targetUsername;

    socket.emit('actionConfirmed', { message: `Action confirmed: targeting ${targetUsername}` });
    checkNightComplete(roomCode);
  });

  socket.on('castVote', ({ roomCode, targetUsername }) => {
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'day') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive) return;

    room.votes[player.username] = targetUsername;

    const alivePlayers = room.players.filter(p => p.isAlive);
    const voteCount = Object.keys(room.votes).length;

    io.to(roomCode).emit('voteUpdate', {
      votes: room.votes,
      voted: voteCount,
      total: alivePlayers.length
    });

    broadcastChat(roomCode, `🗳️ ${player.username} has voted!`, 'system');

    if (voteCount >= alivePlayers.length) {
      resolveDayVote(roomCode);
    }
  });

  socket.on('sendChat', ({ roomCode, message }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    if (room.phase === 'night' && player.role === 'werewolf' && player.isAlive) {
      const werewolves = room.players.filter(p => p.role === 'werewolf');
      werewolves.forEach(w => {
        io.to(w.id).emit('chatMessage', {
          username: player.username,
          message,
          type: 'werewolf',
          timestamp: new Date().toLocaleTimeString()
        });
      });
      return;
    }

    if (room.phase === 'day' && player.isAlive) {
      io.to(roomCode).emit('chatMessage', {
        username: player.username,
        message,
        type: 'normal',
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });

  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        broadcastPlayers(roomCode);
        broadcastChat(roomCode, `⚠️ ${socket.username} left the game`, 'system');
      }
    }
    console.log('🔌 Disconnected:', socket.id);
  });
});

function assignRoles(count) {
  const roles = [];
  const werewolfCount = count <= 6 ? 1 : count <= 9 ? 2 : 3;
  for (let i = 0; i < werewolfCount; i++) roles.push('werewolf');
  if (count >= 4) roles.push('seer');
  if (count >= 6) roles.push('doctor');
  while (roles.length < count) roles.push('villager');
  return roles.sort(() => Math.random() - 0.5);
}

function getPublicPlayers(room) {
  return room.players.map(p => ({
    username: p.username,
    isAlive: p.isAlive,
    isHost: p.isHost
  }));
}

function broadcastPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('playerList', getPublicPlayers(room));
}

function broadcastChat(roomCode, message, type = 'system') {
  io.to(roomCode).emit('chatMessage', {
    username: 'System',
    message,
    type,
    timestamp: new Date().toLocaleTimeString()
  });
}

function startNightPhase(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = 'night';
  room.nightActions = {};

  io.to(roomCode).emit('phaseChange', {
    phase: 'night',
    dayCount: room.dayCount,
    message: '🌙 Night falls... Special roles take action!'
  });

  broadcastChat(roomCode, `🌙 Night ${room.dayCount} begins!`, 'system');

  room.players.forEach(p => {
    if (!p.isAlive) return;
    const targets = room.players
      .filter(x => x.isAlive && x.id !== p.id)
      .map(x => x.username);

    if (p.role === 'werewolf') {
      const validTargets = room.players
        .filter(x => x.isAlive && x.role !== 'werewolf')
        .map(x => x.username);
      io.to(p.id).emit('nightInstruction', {
        role: 'werewolf',
        message: '🐺 Choose a villager to eliminate!',
        targets: validTargets
      });
    }
    if (p.role === 'seer') {
      io.to(p.id).emit('nightInstruction', {
        role: 'seer',
        message: '🔮 Choose a player to reveal their identity!',
        targets
      });
    }
    if (p.role === 'doctor') {
      io.to(p.id).emit('nightInstruction', {
        role: 'doctor',
        message: '⚕️ Choose a player to protect tonight!',
        targets: room.players.filter(x => x.isAlive).map(x => x.username)
      });
    }
  });

  setTimeout(() => {
    if (rooms.get(roomCode)?.phase === 'night') {
      resolveNight(roomCode);
    }
  }, 30000);
}

function checkNightComplete(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const aliveWerewolves = room.players.filter(p => p.isAlive && p.role === 'werewolf');
  const aliveSeer = room.players.find(p => p.isAlive && p.role === 'seer');
  const aliveDoctor = room.players.find(p => p.isAlive && p.role === 'doctor');

  const werewolfVoted = aliveWerewolves.length > 0 &&
    aliveWerewolves.every(w => room.nightActions['werewolf']?.[w.username]);
  const seerDone = !aliveSeer || room.nightActions['seer']?.[aliveSeer.username];
  const doctorDone = !aliveDoctor || room.nightActions['doctor']?.[aliveDoctor.username];

  if (werewolfVoted && seerDone && doctorDone) {
    resolveNight(roomCode);
  }
}

function resolveNight(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'night') return;

  const werewolfVotes = room.nightActions['werewolf'] || {};
  const werewolfTarget = getMajorityVote(Object.values(werewolfVotes));
  const doctorTarget = Object.values(room.nightActions['doctor'] || {})[0];
  const seerTarget = Object.values(room.nightActions['seer'] || {})[0];

  let killed = null;

  if (seerTarget) {
    const target = room.players.find(p => p.username === seerTarget);
    const seer = room.players.find(p => p.role === 'seer' && p.isAlive);
    if (target && seer) {
      io.to(seer.id).emit('seerResult', {
        target: seerTarget,
        role: target.role,
        isWerewolf: target.role === 'werewolf'
      });
    }
  }

  if (werewolfTarget && werewolfTarget !== doctorTarget) {
    const targetPlayer = room.players.find(p => p.username === werewolfTarget);
    if (targetPlayer) {
      targetPlayer.isAlive = false;
      killed = werewolfTarget;
    }
  }

  broadcastPlayers(roomCode);

  if (killed) {
    broadcastChat(roomCode, `🌅 Dawn breaks... ${killed} was killed! 😱`, 'system');
  } else {
    broadcastChat(roomCode, `🌅 Dawn breaks... Everyone survived! 🎉`, 'system');
  }

  io.to(roomCode).emit('nightResult', {
    killed,
    protected: werewolfTarget === doctorTarget ? werewolfTarget : null,
    players: getPublicPlayers(room)
  });

  if (checkWinCondition(roomCode)) return;
  setTimeout(() => startDayPhase(roomCode), 3000);
}

function getMajorityVote(votes) {
  if (!votes.length) return null;
  const count = {};
  votes.forEach(v => count[v] = (count[v] || 0) + 1);
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
}

function startDayPhase(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = 'day';
  room.votes = {};

  const alivePlayers = room.players.filter(p => p.isAlive);

  io.to(roomCode).emit('phaseChange', {
    phase: 'day',
    dayCount: room.dayCount,
    message: '☀️ Day begins! Discuss and vote!'
  });

  broadcastChat(roomCode, `☀️ Day ${room.dayCount} begins! Vote to eliminate!`, 'system');

  io.to(roomCode).emit('startVoting', {
    targets: alivePlayers.map(p => p.username)
  });

  setTimeout(() => {
    if (rooms.get(roomCode)?.phase === 'day') {
      resolveDayVote(roomCode);
    }
  }, 60000);
}

function resolveDayVote(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'day') return;

  const eliminated = getMajorityVote(Object.values(room.votes));

  if (eliminated) {
    const targetPlayer = room.players.find(p => p.username === eliminated);
    if (targetPlayer) {
      targetPlayer.isAlive = false;
      broadcastChat(roomCode, `⚖️ ${eliminated} (${targetPlayer.role}) eliminated! 🪓`, 'system');
      io.to(roomCode).emit('playerEliminated', {
        username: eliminated,
        role: targetPlayer.role,
        players: getPublicPlayers(room)
      });
    }
  } else {
    broadcastChat(roomCode, `🤷 No consensus! No one eliminated.`, 'system');
  }

  broadcastPlayers(roomCode);
  if (checkWinCondition(roomCode)) return;

  room.dayCount++;
  setTimeout(() => startNightPhase(roomCode), 3000);
}

function checkWinCondition(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return false;

  const aliveWerewolves = room.players.filter(p => p.isAlive && p.role === 'werewolf');
  const aliveVillagers = room.players.filter(p => p.isAlive && p.role !== 'werewolf');

  if (aliveWerewolves.length === 0) {
    endGame(roomCode, 'villagers', '🏆 Villagers WIN! All werewolves eliminated!');
    return true;
  }

  if (aliveWerewolves.length >= aliveVillagers.length) {
    endGame(roomCode, 'werewolves', '🐺 Werewolves WIN! They took over!');
    return true;
  }

  return false;
}

function endGame(roomCode, winner, message) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = 'ended';

  const roleReveal = room.players.map(p => ({
    username: p.username,
    role: p.role,
    isAlive: p.isAlive
  }));

  io.to(roomCode).emit('gameOver', { winner, message, roleReveal });
  broadcastChat(roomCode, message, 'system');
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
