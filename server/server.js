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
  cors: { origin: "*", methods: ["GET", "POST", "OPTIONS"], credentials: false },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

const db = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || 3306)
});

const rooms = new Map();

db.getConnection()
  .then(conn => { console.log('✅ Database connected!'); conn.release(); })
  .catch(err => console.error('❌ Database error:', err.message));

app.get('/', (req, res) => res.json({ status: 'Sandekala Village Server Running!' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ============================================================
// PHASE CONFIG
// ============================================================
const PHASE_DURATION = {
  siang: 60,    // 60 detik - sidang & vote
  transition_to_senja: 5,
  senja: 30,    // 30 detik - aksi roles
  transition_to_malam: 5,
  malam: 15,    // 15 detik - pengumuman
  transition_to_siang: 5
};

// ============================================================
// SOCKET EVENTS
// ============================================================
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

    broadcastPlayers(roomCode);
    socket.emit('roomJoined', { roomCode, roomName: room.name });
    broadcastChat(roomCode, `👤 ${username} asup ka lembur!`, 'system');
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
      broadcastPlayers(roomCode);
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
      broadcastPlayers(roomCode);
      broadcastChat(roomCode, `⚠️ ${username} dikaluarkeun ku host`, 'system');
    }
  });

  // ── START GAME (host only) ──
  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('gameError', { message: 'Rohangan teu kapanggih!' });
    if (room.host.id !== socket.id) return socket.emit('gameError', { message: 'Ngan host anu bisa mimitian!' });
    if (room.players.length < 3) return socket.emit('gameError', { message: 'Butuh minimal 3 pamain!' });

    // Assign roles
    const roles = assignRoles(room.players.length);
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
          players: getPublicPlayers(room),
          dayCount: room.dayCount
        });
        // Mulai dari SIANG
        setTimeout(() => startSiangPhase(roomCode), 500);
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

    checkSenjaComplete(roomCode);
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

    broadcastChat(roomCode, `🕌 Ruqyah Massal diaktifkeun! Sanekala teu bisa ngalakukeun aksi!`, 'system');
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

    broadcastChat(roomCode, `🗳️ ${player.username} geus milih!`, 'system');

    if (voteCount >= alivePlayers.length) {
      resolveSiangVote(roomCode);
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

    clearPhaseTimer(roomCode);
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

    broadcastPlayers(roomCode);
  });

  // ── RESTART GAME (host only) ──
  socket.on('restartGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    clearPhaseTimer(roomCode);
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
      players: getPublicPlayers(room),
      message: 'Kaulinan dimimitian deui!'
    });

    broadcastPlayers(roomCode);
    broadcastChat(roomCode, '🔄 Host mimitian kaulinan anyar!', 'system');
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
          broadcastPlayers(roomCode);
          if (socket.username) {
            broadcastChat(roomCode, `⚠️ ${socket.username} kaluar tina lembur`, 'system');
          }
        }
      }
    }
    console.log('🔌 Disconnected:', socket.id);
  });
});

// ============================================================
// GAME LOGIC FUNCTIONS
// ============================================================

function assignRoles(count) {
  const roles = [];

  // Sanekala scaling
  const sanekalaCount = count <= 5 ? 1
    : count <= 8 ? 2
    : count <= 12 ? 3
    : count <= 16 ? 4
    : 5; // max 5 sanekala untuk 17-20 player

  for (let i = 0; i < sanekalaCount; i++) roles.push('werewolf');

  // Special roles
  if (count >= 4) roles.push('seer');      // Dukun
  if (count >= 6) roles.push('doctor');    // Kolot
  if (count >= 7) roles.push('kuncen');    // Kuncen
  if (count >= 8) roles.push('ajengan');   // Ajengan

  // Sisa = Budak
  while (roles.length < count) roles.push('villager');

  return roles.sort(() => Math.random() - 0.5);
}

function getPublicPlayers(room) {
  return room.players.map(p => ({
    username: p.username,
    isAlive: p.isAlive,
    isLocked: room.lockedPlayers?.includes(p.username) || false
  }));
}

function getSanekalaPlayers(room) {
  return room.players
    .filter(p => p.role === 'werewolf')
    .map(p => ({
      username: p.username,
      isAlive: p.isAlive
    }));
}

function broadcastPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('playerList', getPublicPlayers(room));

  // Kirim info sanekala ke sesama sanekala
  const sanekalaList = getSanekalaPlayers(room);
  room.players
    .filter(p => p.role === 'werewolf')
    .forEach(p => {
      io.to(p.id).emit('sanekalaList', sanekalaList);
    });
}

function broadcastChat(roomCode, message, type = 'system') {
  io.to(roomCode).emit('chatMessage', {
    username: 'Lembur',
    message,
    type,
    timestamp: new Date().toLocaleTimeString()
  });
}

function clearPhaseTimer(roomCode) {
  const room = rooms.get(roomCode);
  if (room?.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }
}

// ── SIANG PHASE ──
function startSiangPhase(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clearPhaseTimer(roomCode);
  room.phase = 'siang';
  room.votes = {};
  room.lockedPlayers = room.lockedPlayers || [];

  const alivePlayers = room.players.filter(p => p.isAlive);
  const voteTargets = alivePlayers
    .filter(p => !room.lockedPlayers.includes(p.username))
    .map(p => p.username);

  io.to(roomCode).emit('phaseChange', {
    phase: 'siang',
    dayCount: room.dayCount,
    duration: PHASE_DURATION.siang,
    message: 'Panonpoe caang... Sanekala nyamar jadi warga biasa. Saha anu bisa dipercaya?',
    voteTargets,
    lockedPlayers: room.lockedPlayers
  });

  broadcastChat(roomCode, `☀️ Beurang ka-${room.dayCount} dimimitian! Diskusi jeung pilih saha Sanekala!`, 'system');

  if (room.lockedPlayers.length > 0) {
    broadcastChat(roomCode, `🔒 ${room.lockedPlayers.join(', ')} dikunci ku Kuncen!`, 'system');
  }

  // Auto resolve setelah 60 detik
  room.phaseTimer = setTimeout(() => {
    if (rooms.get(roomCode)?.phase === 'siang') {
      resolveSiangVote(roomCode);
    }
  }, PHASE_DURATION.siang * 1000);
}

function resolveSiangVote(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'siang') return;

  clearPhaseTimer(roomCode);

  const eliminated = getMajorityVote(Object.values(room.votes));
  let eliminatedRole = null;

  if (eliminated) {
    const targetPlayer = room.players.find(p => p.username === eliminated);
    if (targetPlayer) {
      targetPlayer.isAlive = false;
      eliminatedRole = targetPlayer.role;

      // Ajengan wasiat saat mati
      if (targetPlayer.role === 'ajengan') {
        const alivePlayers = room.players.filter(p => p.isAlive && p.role !== 'werewolf');
        if (alivePlayers.length > 0) {
          const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          const targetInfo = room.players.find(p => p.username === randomTarget.username);
          io.to(targetPlayer.id).emit('ajenganWasiat', {
            message: `📜 Wasiat Ajengan: ${randomTarget.username} nyaéta ${getRoleName(targetInfo?.role)}!`
          });
        }
      }

      broadcastChat(roomCode,
        `⚖️ ${eliminated} diusir tina lembur! Manéhna téh ${getRoleName(eliminatedRole)}!`,
        'system'
      );

      io.to(roomCode).emit('playerEliminated', {
        username: eliminated,
        role: eliminatedRole,
        players: getPublicPlayers(room)
      });
    }
  } else {
    broadcastChat(roomCode, `🤷 Teu aya kasapukan! Teu aya anu diusir.`, 'system');
  }

  broadcastPlayers(roomCode);

  if (checkWinCondition(roomCode)) return;

  // Transisi ke Senja
  startTransition(roomCode, 'senja');
}

// ── SENJA PHASE ──
function startSenjaPhase(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clearPhaseTimer(roomCode);
  room.phase = 'senja';
  room.nightActions = {};
  room.lockedPlayers = [];

  io.to(roomCode).emit('phaseChange', {
    phase: 'senja',
    dayCount: room.dayCount,
    duration: PHASE_DURATION.senja,
    message: 'Azan Maghrib geus kadéngé... Sanekala mimiti nembongkeun wujud aslina!'
  });

  broadcastChat(roomCode, `🌅 Senja ka-${room.dayCount} datang! Sanekala ngaliar!`, 'system');

  // Kirim instruksi ke tiap role
  room.players.forEach(p => {
    if (!p.isAlive) return;

    const allTargets = room.players.filter(x => x.isAlive && x.id !== p.id).map(x => x.username);
    const nonSanekalaTargets = room.players.filter(x => x.isAlive && x.role !== 'werewolf').map(x => x.username);
    const allAlive = room.players.filter(x => x.isAlive).map(x => x.username);

    switch(p.role) {
      case 'werewolf':
        // Cek ruqyah massal
        if (room.nightActions['ruqyah_massal']) {
          io.to(p.id).emit('nightInstruction', {
            role: 'werewolf',
            message: '🕌 Ruqyah Massal aktif! Maneh teu bisa ngalakukeun aksi senja ieu!',
            targets: [],
            blocked: true
          });
        } else {
          io.to(p.id).emit('nightInstruction', {
            role: 'werewolf',
            message: '👹 Pilih budak anu rék ditipu senja ieu!',
            targets: nonSanekalaTargets,
            blocked: false
          });
        }
        break;

      case 'seer':
        io.to(p.id).emit('nightInstruction', {
          role: 'seer',
          message: '🔮 Pilih saha anu hayang maneh intip jati dirina!',
          targets: allTargets
        });
        break;

      case 'doctor':
        io.to(p.id).emit('nightInstruction', {
          role: 'doctor',
          message: '👴 Pilih budak anu rék maneh jaga senja ieu!',
          targets: allAlive
        });
        break;

      case 'kuncen':
        io.to(p.id).emit('nightInstruction', {
          role: 'kuncen',
          message: p.isShielded
            ? '🗝️ Pilih aksi Kuncen:\n• Gunakeun Kebal (lindungi diri)\n• Kunci Pamain (skip vote)'
            : '🗝️ Kebal geus dipake! Pilih saha anu rék dikunci tina sidang!',
          targets: allTargets,
          hasShield: p.isShielded
        });
        break;

      case 'ajengan':
        io.to(p.id).emit('nightInstruction', {
          role: 'ajengan',
          message: '🕌 Pilih saha anu rék maneh doakeun senja ieu!',
          targets: allAlive,
          ruqyahAvailable: !room.ajenganRuqyahUsed
        });
        break;

      default:
        io.to(p.id).emit('nightInstruction', {
          role: 'villager',
          message: '👦 Geura balik ka imah! Senja geus datang, Sanekala ngaliar!',
          targets: [],
          blocked: true
        });
        break;
    }
  });

  // Auto resolve setelah 30 detik
  room.phaseTimer = setTimeout(() => {
    if (rooms.get(roomCode)?.phase === 'senja') {
      resolveSenja(roomCode);
    }
  }, PHASE_DURATION.senja * 1000);
}

function checkSenjaComplete(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const aliveWerewolves = room.players.filter(p => p.isAlive && p.role === 'werewolf');
  const aliveSeer = room.players.find(p => p.isAlive && p.role === 'seer');
  const aliveDoctor = room.players.find(p => p.isAlive && p.role === 'doctor');
  const aliveKuncen = room.players.find(p => p.isAlive && p.role === 'kuncen');
  const aliveAjengan = room.players.find(p => p.isAlive && p.role === 'ajengan');

  const ruqyahActive = room.nightActions['ruqyah_massal'];

  const sanekalasDone = ruqyahActive ||
    (aliveWerewolves.length > 0 &&
    aliveWerewolves.every(w => room.nightActions['werewolf']?.[w.username]));
  const seerDone = !aliveSeer || room.nightActions['seer']?.[aliveSeer.username];
  const doctorDone = !aliveDoctor || room.nightActions['doctor']?.[aliveDoctor.username];
  const kuncenDone = !aliveKuncen ||
    room.nightActions['kuncen']?.[aliveKuncen.username] ||
    room.nightActions['kuncen_lock']?.[aliveKuncen.username];
  const ajenganDone = !aliveAjengan || room.nightActions['ajengan']?.[aliveAjengan.username];

  if (sanekalasDone && seerDone && doctorDone && kuncenDone && ajenganDone) {
    clearPhaseTimer(roomCode);
    resolveSenja(roomCode);
  }
}

function resolveSenja(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'senja') return;

  clearPhaseTimer(roomCode);

  // Ambil aksi
  const werewolfVotes = room.nightActions['werewolf'] || {};
  const werewolfTargets = Object.values(werewolfVotes).map(a => a.target);
  const werewolfTarget = getMajorityVote(werewolfTargets);

  const doctorAction = Object.values(room.nightActions['doctor'] || {})[0];
  const doctorTarget = doctorAction?.target;

  const seerAction = Object.values(room.nightActions['seer'] || {})[0];
  const seerTarget = seerAction?.target;

  const kuncenAction = Object.values(room.nightActions['kuncen'] || {})[0];
  const kuncenLockAction = Object.values(room.nightActions['kuncen_lock'] || {})[0];

  const ajenganAction = Object.values(room.nightActions['ajengan'] || {})[0];
  const ajenganTarget = ajenganAction?.target;

  let killed = null;
  let protectedBy = null;
  let lockedPlayer = null;

  // Seer result (private)
  if (seerTarget) {
    const target = room.players.find(p => p.username === seerTarget);
    const seer = room.players.find(p => p.role === 'seer' && p.isAlive);
    if (target && seer) {
      io.to(seer.id).emit('seerResult', {
        target: seerTarget,
        role: target.role,
        isSanekala: target.role === 'werewolf'
      });
    }
  }

  // Kuncen shield
  const kuncen = room.players.find(p => p.role === 'kuncen' && p.isAlive);
  if (kuncen && kuncenAction?.actionType === 'shield' && kuncen.isShielded) {
    kuncen.isShielded = false;
  }

  // Kuncen lock
  if (kuncenLockAction?.target) {
    lockedPlayer = kuncenLockAction.target;
    room.lockedPlayers = [lockedPlayer];
  } else if (kuncenAction?.actionType === 'lock') {
    lockedPlayer = kuncenAction.target;
    room.lockedPlayers = [lockedPlayer];
  }

  // Resolve kill (kalau ruqyah massal aktif, skip kill)
  if (werewolfTarget && !room.nightActions['ruqyah_massal']) {
    const targetPlayer = room.players.find(p => p.username === werewolfTarget);

    if (werewolfTarget === doctorTarget || werewolfTarget === ajenganTarget) {
      protectedBy = werewolfTarget === doctorTarget ? 'kolot' : 'ajengan';
    } else if (targetPlayer?.role === 'kuncen' && targetPlayer?.isShielded) {
      targetPlayer.isShielded = false;
      protectedBy = 'kuncen';
    } else if (targetPlayer) {
      targetPlayer.isAlive = false;
      killed = werewolfTarget;
    }
  }

  broadcastPlayers(roomCode);

  // Simpan history
  room.gameHistory.push({
    day: room.dayCount,
    killed,
    protectedBy,
    lockedPlayer
  });

  // Kirim hasil ke semua
  io.to(roomCode).emit('senjaResult', {
    killed,
    protectedBy,
    lockedPlayer,
    players: getPublicPlayers(room)
  });

  // Transisi ke Malam
  startTransition(roomCode, 'malam', { killed, protectedBy, lockedPlayer });
}

// ── MALAM PHASE (Pengumuman) ──
function startMalamPhase(roomCode, senjaResult = {}) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clearPhaseTimer(roomCode);
  room.phase = 'malam';

  const { killed, protectedBy, lockedPlayer } = senjaResult;

  let announcement = '';
  if (killed) {
    announcement = `😱 ${killed} kapanggih leungit! Diculik ku Sanekala!`;
  } else if (protectedBy) {
    const protectorName = {
      kolot: 'Kolot',
      ajengan: 'Ajengan',
      kuncen: 'Kuncen'
    }[protectedBy];
    announcement = `🛡️ Hiji urang diselamatkeun ku ${protectorName}! Sadaya salamet!`;
  } else {
    announcement = `🎉 Sadaya urang salamet senja ieu!`;
  }

  if (lockedPlayer) {
    announcement += ` 🔒 ${lockedPlayer} dikunci ku Kuncen!`;
  }

  io.to(roomCode).emit('phaseChange', {
    phase: 'malam',
    dayCount: room.dayCount,
    duration: PHASE_DURATION.malam,
    message: announcement,
    killed,
    protectedBy,
    lockedPlayer
  });

  broadcastChat(roomCode, `🌙 ${announcement}`, 'system');

  if (checkWinCondition(roomCode)) return;

  room.dayCount++;

  // Transisi ke Siang
  room.phaseTimer = setTimeout(() => {
    startTransition(roomCode, 'siang');
  }, PHASE_DURATION.malam * 1000);
}

// ── TRANSITION ──
function startTransition(roomCode, nextPhase, data = {}) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const prevPhase = room.phase;
  room.phase = `transition_to_${nextPhase}`;

  io.to(roomCode).emit('phaseTransition', {
    from: prevPhase,
    to: nextPhase,
    duration: PHASE_DURATION[`transition_to_${nextPhase}`] || 5,
    data
  });

  setTimeout(() => {
    if (nextPhase === 'siang') startSiangPhase(roomCode);
    else if (nextPhase === 'senja') startSenjaPhase(roomCode);
    else if (nextPhase === 'malam') startMalamPhase(roomCode, data);
  }, (PHASE_DURATION[`transition_to_${nextPhase}`] || 5) * 1000);
}

// ── HELPERS ──
function getMajorityVote(votes) {
  if (!votes || !votes.length) return null;
  const count = {};
  votes.forEach(v => { if (v) count[v] = (count[v] || 0) + 1; });
  if (!Object.keys(count).length) return null;
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
}

function getRoleName(role) {
  const names = {
    werewolf: 'Sanekala 👹',
    seer: 'Dukun 🔮',
    doctor: 'Kolot 👴',
    kuncen: 'Kuncen 🗝️',
    ajengan: 'Ajengan 🕌',
    villager: 'Budak 👦'
  };
  return names[role] || role;
}

function checkWinCondition(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return false;

  const aliveSanekala = room.players.filter(p => p.isAlive && p.role === 'werewolf');
  const aliveOthers = room.players.filter(p => p.isAlive && p.role !== 'werewolf');

  if (aliveSanekala.length === 0) {
    endGame(roomCode, 'warga',
      '🏆 Urang Lembur Meunang! Sadaya Sanekala geus diusir! Budak-budak aman!'
    );
    return true;
  }

  if (aliveSanekala.length >= aliveOthers.length) {
    endGame(roomCode, 'sanekala',
      '👹 Sanekala Meunang! Maranéhna geus nguasai lembur! Budak-budak sadayana diculik!'
    );
    return true;
  }

  return false;
}

function endGame(roomCode, winner, message) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clearPhaseTimer(roomCode);
  room.phase = 'ended';

  const roleReveal = room.players.map(p => ({
    username: p.username,
    role: p.role,
    isAlive: p.isAlive
  }));

  io.to(roomCode).emit('gameOver', { winner, message, roleReveal });
  broadcastChat(roomCode, message, 'system');

  // Update DB
  db.execute(
    'UPDATE rooms SET status = ? WHERE room_code = ?',
    ['finished', roomCode]
  ).catch(err => console.error('DB update error:', err));
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sandekala Village Server running on PORT ${PORT}`);
});
