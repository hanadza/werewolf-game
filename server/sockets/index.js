const rooms = require('../state/rooms');
const db = require('../config/db');
const gameLogic = require('../utils/gameLogic');

module.exports = function(io) {
  io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  // ── CREATE ROOM ──
socket.on('createRoom', async ({ roomName, maxPlayers, hostUsername }) => {
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const [result] = await db.execute(
        'INSERT INTO rooms (room_code, name, max_players) VALUES (?, ?, ?)',
        [roomCode, roomName, maxPlayers || 8]
      );

      rooms.set(roomCode, {
        id: result.insertId,
        code: roomCode,
        name: roomName,
        maxPlayers: maxPlayers || 8, // default 8, max 20
        host: { id: socket.id, username: hostUsername || 'Host' },
        players: [],
        phase: 'lobby',
        votes: {},
        nightActions: {},
        dayCount: 1,
        lockedPlayers: [],
        ajenganRuqyahUsed: false,
        kuncenShieldUsed: [],
        phaseTimer: null,
        gameHistory: []
      });

      socket.roomCode = roomCode;
      socket.isHost = true;
      socket.join(roomCode);

      socket.emit('roomCreated', {
        roomCode,
        roomName,
        maxPlayers: maxPlayers || 8
      });

      console.log(`🏠 Room ${roomCode} created by host ${socket.id}`);
    } catch (error) {
      console.error('Error createRoom:', error);
      socket.emit('gameError', { message: error.message });
    }
  });

  // ── SET HOST USERNAME ──
  socket.on('setHostUsername', ({ roomCode, username }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.host.username = username;
    room.host.id = socket.id;
    io.to(roomCode).emit('hostInfo', { username });
  });

  // ── JOIN ROOM ──
  socket.on('joinRoom', ({ roomCode, username }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('gameError', { message: 'Rohangan teu kapanggih!' });
    if (room.players.length >= room.maxPlayers) return socket.emit('gameError', { message: 'Rohangan pinuh!' });
    if (room.phase !== 'lobby') return socket.emit('gameError', { message: 'Kaulinan geus dimimitian!' });
    if (room.players.find(p => p.username === username)) {
      return socket.emit('gameError', { message: 'Ngaran geus dipaké!' });
    }

    const player = {
      id: socket.id,
      username,
      role: null,
      isAlive: true,
      isShielded: false,
      isLocked: false
    };

    room.players.push(player);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;
    socket.isHost = false;

    gameLogic.broadcastPlayers(roomCode);
    socket.emit('roomJoined', { roomCode, roomName: room.name });
    gameLogic.broadcastChat(roomCode, `👤 ${username} asup ka lembur!`, 'system');
    console.log(`👤 ${username} joined ${roomCode}`);
  });

  // ── REJOIN ROOM (setelah game selesai) ──
  socket.on('rejoinRoom', ({ roomCode, username }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('gameError', { message: 'Rohangan teu kapanggih!' });

    const existingPlayer = room.players.find(p => p.username === username);
    if (existingPlayer) {
      existingPlayer.id = socket.id;
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.username = username;
      gameLogic.broadcastPlayers(roomCode);
      socket.emit('roomJoined', { roomCode, roomName: room.name });
    }
  });

  // ── UPDATE MAX PLAYERS (host only) ──
  socket.on('updateMaxPlayers', ({ roomCode, maxPlayers }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;
    room.maxPlayers = maxPlayers;
    io.to(roomCode).emit('roomUpdated', { maxPlayers });
  });

  // ── KICK PLAYER (host only) ──
  socket.on('kickPlayer', ({ roomCode, username }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    const player = room.players.find(p => p.username === username);
    if (player) {
      io.to(player.id).emit('kicked', { message: 'Maneh dikaluarkeun ku host!' });
      room.players = room.players.filter(p => p.username !== username);
      gameLogic.broadcastPlayers(roomCode);
      gameLogic.broadcastChat(roomCode, `⚠️ ${username} dikaluarkeun ku host`, 'system');
    }
  });

  // ── START GAME (host only) ──
  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('gameError', { message: 'Rohangan teu kapanggih!' });
    if (room.host.id !== socket.id) return socket.emit('gameError', { message: 'Ngan host anu bisa mimitian!' });
    if (room.players.length < 3) return socket.emit('gameError', { message: 'Butuh minimal 3 pamain!' });

    // Assign roles
    const roles = gameLogic.assignRoles(room.players.length);
    room.players.forEach((p, i) => {
      p.role = roles[i];
      p.isAlive = true;
      p.isShielded = p.role === 'kuncen';
      p.isLocked = false;
    });

    room.phase = 'countdown';
    room.nightActions = {};
    room.votes = {};
    room.lockedPlayers = [];
    room.dayCount = 1;
    room.ajenganRuqyahUsed = false;
    room.kuncenShieldUsed = [];
    room.gameHistory = [];

    // Kirim role ke masing-masing player
    room.players.forEach(p => {
      const teammates = p.role === 'werewolf'
        ? room.players.filter(x => x.role === 'werewolf' && x.id !== p.id).map(x => x.username)
        : [];
      io.to(p.id).emit('yourRole', { role: p.role, teammates });
    });

    // Kirim info ke host (host lihat semua role)
    io.to(room.host.id).emit('hostRoleInfo', {
      players: room.players.map(p => ({
        username: p.username,
        role: p.role
      }))
    });

    // Countdown 3 detik
    io.to(roomCode).emit('gameCountdown', { count: 3 });

    let count = 3;
    const countInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countInterval);
        io.to(roomCode).emit('gameStarted', {
          players: gameLogic.getPublicPlayers(room),
          dayCount: room.dayCount
        });
        // Mulai dari SIANG
        setTimeout(() => gameLogic.startSiangPhase(roomCode), 500);
      } else {
        io.to(roomCode).emit('gameCountdown', { count });
      }
    }, 1000);
  });

  // ── NIGHT ACTION ──
  socket.on('nightAction', ({ roomCode, targetUsername, actionType }) => {
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'senja') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive) return;

    room.nightActions[player.role] = room.nightActions[player.role] || {};
    room.nightActions[player.role][player.username] = { target: targetUsername, actionType };

    console.log(`🌅 Senja action: ${player.username} (${player.role}) -> ${targetUsername} [${actionType}]`);

    socket.emit('actionConfirmed', {
      message: `Aksi dikonfirmasi → ${targetUsername}`
    });

    gameLogic.checkSenjaComplete(roomCode);
  });

  // ── AJENGAN RUQYAH MASSAL ──
  socket.on('ruqyahMassal', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'siang') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive || player.role !== 'ajengan') return;
    if (room.ajenganRuqyahUsed) return socket.emit('gameError', { message: 'Ruqyah Massal geus dipaké!' });

    room.ajenganRuqyahUsed = true;
    room.nightActions['ruqyah_massal'] = true;

    // Sanekala tahu siapa Ajengan
    const sanekalaPlayers = room.players.filter(p => p.role === 'werewolf' && p.isAlive);
    sanekalaPlayers.forEach(s => {
      io.to(s.id).emit('ajenganRevealed', {
        username: player.username,
        message: `⚠️ ${player.username} nyaéta Ajengan! Manéhna geus ngagunakeun Ruqyah Massal!`
      });
    });

    io.to(roomCode).emit('ruqyahMassalActivated', {
      username: player.username,
      message: `🕌 ${player.username} ngagunakeun Ruqyah Massal! Sanekala teu bisa ngalakukeun aksi senja ieu!`
    });

    gameLogic.broadcastChat(roomCode, `🕌 Ruqyah Massal diaktifkeun! Sanekala teu bisa ngalakukeun aksi!`, 'system');
  });

  // ── CAST VOTE ──
  socket.on('castVote', ({ roomCode, targetUsername }) => {
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'siang') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive) return;

    if (room.lockedPlayers.includes(targetUsername)) {
      return socket.emit('gameError', {
        message: `${targetUsername} dikunci ku Kuncen! Teu bisa divote!`
      });
    }

    room.votes[player.username] = targetUsername;

    const alivePlayers = room.players.filter(p => p.isAlive);
    const voteCount = Object.keys(room.votes).length;

    io.to(roomCode).emit('voteUpdate', {
      votes: room.votes,
      voted: voteCount,
      total: alivePlayers.length,
      lockedPlayers: room.lockedPlayers
    });

    gameLogic.broadcastChat(roomCode, `🗳️ ${player.username} geus milih!`, 'system');

    if (voteCount >= alivePlayers.length) {
      gameLogic.resolveSiangVote(roomCode);
    }
  });

  // ── SEND CHAT ──
  socket.on('sendChat', ({ roomCode, message }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Senja: hanya Sanekala yang bisa chat sesama Sanekala
    if (room.phase === 'senja') {
      if (player.role === 'werewolf' && player.isAlive) {
        const sanekalaPlayers = room.players.filter(p => p.role === 'werewolf');
        sanekalaPlayers.forEach(s => {
          io.to(s.id).emit('chatMessage', {
            username: player.username,
            message,
            type: 'sanekala',
            timestamp: new Date().toLocaleTimeString()
          });
        });
      }
      return;
    }

    // Siang: semua yang hidup bisa chat
    if (room.phase === 'siang' && player.isAlive) {
      io.to(roomCode).emit('chatMessage', {
        username: player.username,
        message,
        type: 'normal',
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });

  // ── END GAME (host only) ──
  socket.on('endGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    gameLogic.clearPhaseTimer(roomCode);
    room.phase = 'lobby';
    room.players.forEach(p => {
      p.role = null;
      p.isAlive = true;
      p.isShielded = false;
      p.isLocked = false;
    });
    room.votes = {};
    room.nightActions = {};
    room.lockedPlayers = [];
    room.dayCount = 1;

    io.to(roomCode).emit('gameEnded', {
      message: 'Host geus ngakhiran kaulinan. Balik ka rohangan antosan...'
    });

    gameLogic.broadcastPlayers(roomCode);
  });

  // ── RESTART GAME (host only) ──
  socket.on('restartGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    gameLogic.clearPhaseTimer(roomCode);
    room.phase = 'lobby';
    room.players.forEach(p => {
      p.role = null;
      p.isAlive = true;
      p.isShielded = false;
    });
    room.votes = {};
    room.nightActions = {};
    room.lockedPlayers = [];
    room.dayCount = 1;
    room.ajenganRuqyahUsed = false;

    io.to(roomCode).emit('gameRestarted', {
      players: gameLogic.getPublicPlayers(room),
      message: 'Kaulinan dimimitian deui!'
    });

    gameLogic.broadcastPlayers(roomCode);
    gameLogic.broadcastChat(roomCode, '🔄 Host mimitian kaulinan anyar!', 'system');
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        if (socket.isHost) {
          // Host disconnect - notify players
          io.to(roomCode).emit('hostDisconnected', {
            message: '⚠️ Host kaluar! Kaulinan dihentikan samentara...'
          });
        } else {
          room.players = room.players.filter(p => p.id !== socket.id);
          gameLogic.broadcastPlayers(roomCode);
          if (socket.username) {
            gameLogic.broadcastChat(roomCode, `⚠️ ${socket.username} kaluar tina lembur`, 'system');
          }
        }
      }
    }
    console.log('🔌 Disconnected:', socket.id);
  });
});
};
