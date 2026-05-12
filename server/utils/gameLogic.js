const rooms = require('../state/rooms');
const db = require('../config/db');
const { PHASE_DURATION } = require('../config/constants');
let io;

function setIo(socketIo) { io = socketIo; }

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
    isLocked: room.lockedPlayers?.includes(p.username) || false,
    isHost: room.host && room.host.id === p.id
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

  // Hari pertama = tidak ada vote (belum ada korban)
  const isFirstDay = room.dayCount === 1;

  const alivePlayers = room.players.filter(p => p.isAlive);
  const voteTargets = isFirstDay ? [] : alivePlayers
    .filter(p => !room.lockedPlayers.includes(p.username))
    .map(p => p.username);

  const message = isFirstDay
    ? 'Selamat datang di desa! Kenalan dulu dengan yang lain sebelum senja datang...'
    : 'Matahari bersinar... Sanekala menyamar jadi warga biasa. Siapa yang bisa dipercaya?';

  const siangDuration = isFirstDay
    ? PHASE_DURATION.siang_pertama
    : PHASE_DURATION.siang;

  io.to(roomCode).emit('phaseChange', {
    phase: 'siang',
    dayCount: room.dayCount,
    duration: siangDuration,
    message,
    voteTargets,
    lockedPlayers: room.lockedPlayers,
    isFirstDay
  });

  if (isFirstDay) {
    broadcastChat(roomCode,
      `☀️ Permainan dimulai! Ini adalah siang ke-1. Kenalan dulu, tidak ada sidang!`,
      'system'
    );
    broadcastChat(roomCode,
      `🌅 Senja akan datang... Sanekala akan berkeliaran. Hati-hati!`,
      'system'
    );
  } else {
    broadcastChat(roomCode,
      `☀️ Siang ke-${room.dayCount} dimulai! Diskusi dan pilih siapa Sanekala!`,
      'system'
    );
    if (room.lockedPlayers.length > 0) {
      broadcastChat(roomCode,
        `🔒 ${room.lockedPlayers.join(', ')} dikunci oleh Kuncen! Tidak bisa divote!`,
        'system'
      );
    }
  }

  // Auto resolve
  room.phaseTimer = setTimeout(() => {
    if (rooms.get(roomCode)?.phase === 'siang') {
      if (isFirstDay) {
        startTransition(roomCode, 'senja');
      } else {
        resolveSiangVote(roomCode);
      }
    }
  }, siangDuration * 1000);
}

function resolveSiangVote(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'siang') return;

  // Hari pertama tidak ada vote
  if (room.dayCount === 1) {
    startTransition(roomCode, 'senja');
    return;
  }

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
            message: `📜 Wasiat Ajengan: ${randomTarget.username} adalah ${getRoleName(targetInfo?.role)}!`
          });
        }
      }

      broadcastChat(roomCode,
        `⚖️ ${eliminated} diusir dari desa! Dia adalah ${getRoleName(eliminatedRole)}!`,
        'system'
      );

      io.to(roomCode).emit('playerEliminated', {
        username: eliminated,
        role: eliminatedRole,
        players: getPublicPlayers(room)
      });
    }
  } else {
    broadcastChat(roomCode, `🤷 Tidak ada kesepakatan! Tidak ada yang diusir.`, 'system');
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
    message: 'Azan Maghrib mulai terdengar... Sanekala mulai menampakkan wujud aslinya!'
  });

  broadcastChat(roomCode, `🌅 Senja ke-${room.dayCount} datang! Sanekala berkeliaran!`, 'system');

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
            message: '🕌 Ruqyah Massal aktif! Kamu tidak bisa melakukan aksi senja ini!',
            targets: [],
            blocked: true
          });
        } else {
          io.to(p.id).emit('nightInstruction', {
            role: 'werewolf',
            message: '👹 Pilih warga yang mau kamu serang senja ini!',
            targets: nonSanekalaTargets,
            blocked: false
          });
        }
        break;

      case 'seer':
        io.to(p.id).emit('nightInstruction', {
          role: 'seer',
          message: '🔮 Pilih siapa yang ingin kamu intip jati dirinya!',
          targets: allTargets
        });
        break;

      case 'doctor':
        io.to(p.id).emit('nightInstruction', {
          role: 'doctor',
          message: '👴 Pilih warga yang mau kamu jaga senja ini!',
          targets: allAlive
        });
        break;

      case 'kuncen':
        io.to(p.id).emit('nightInstruction', {
          role: 'kuncen',
          message: p.isShielded
            ? '🗝️ Pilih aksi Kuncen:\n• Gunakan Kebal (lindungi diri)\n• Kunci Pemain (skip vote)'
            : '🗝️ Kebal sudah terpakai! Pilih siapa yang mau dikunci dari sidang!',
          targets: allTargets,
          hasShield: p.isShielded
        });
        break;

      case 'ajengan':
        io.to(p.id).emit('nightInstruction', {
          role: 'ajengan',
          message: '🕌 Pilih siapa yang ingin kamu doakan senja ini!',
          targets: allAlive,
          ruqyahAvailable: !room.ajenganRuqyahUsed
        });
        break;

      default:
        io.to(p.id).emit('nightInstruction', {
          role: 'villager',
          message: '👦 Cepat pulang ke rumah! Senja sudah datang, Sanekala berkeliaran!',
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
    announcement = `😱 ${killed} hilang! Diculik oleh Sanekala!`;
  } else if (protectedBy) {
    const protectorName = {
      kolot: 'Kolot',
      ajengan: 'Ajengan',
      kuncen: 'Kuncen'
    }[protectedBy];
    announcement = `🛡️ Satu warga diselamatkan oleh ${protectorName}! Semua selamat!`;
  } else {
    announcement = `🎉 Semua warga selamat senja ini!`;
  }

  if (lockedPlayer) {
    announcement += ` 🔒 ${lockedPlayer} dikunci oleh Kuncen!`;
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
      '🏆 Warga Desa Menang! Semua Sanekala berhasil diusir! Warga aman!'
    );
    return true;
  }

  if (aliveSanekala.length >= aliveOthers.length) {
    endGame(roomCode, 'sanekala',
      '👹 Sanekala Menang! Mereka telah menguasai desa! Semua warga diculik!'
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



module.exports = {
  setIo,
  assignRoles,
  getPublicPlayers,
  getSanekalaPlayers,
  broadcastPlayers,
  broadcastChat,
  clearPhaseTimer,
  startSiangPhase,
  resolveSiangVote,
  startSenjaPhase,
  checkSenjaComplete,
  resolveSenja,
  startMalamPhase,
  startTransition,
  getMajorityVote,
  getRoleName,
  checkWinCondition,
  endGame
};

module.exports = {
  setIo,
  assignRoles,
  getPublicPlayers,
  getSanekalaPlayers,
  broadcastPlayers,
  broadcastChat,
  clearPhaseTimer,
  startSiangPhase,
  resolveSiangVote,
  startSenjaPhase,
  checkSenjaComplete,
  resolveSenja,
  startMalamPhase,
  startTransition,
  getMajorityVote,
  getRoleName,
  checkWinCondition,
  endGame
};
