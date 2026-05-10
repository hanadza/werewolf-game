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

  // Hari pertama = tidak ada vote (belum ada korban)
  const isFirstDay = room.dayCount === 1;

  const alivePlayers = room.players.filter(p => p.isAlive);
  const voteTargets = isFirstDay ? [] : alivePlayers
    .filter(p => !room.lockedPlayers.includes(p.username))
    .map(p => p.username);

  const message = isFirstDay
    ? 'Wilujeng sumping di lembur! Kenalan heula jeung batur saméméh senja datang...'
    : 'Panonpoe caang... Sanekala nyamar jadi warga biasa. Saha anu bisa dipercaya?';

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
      `☀️ Kaulinan dimimitian! Ieu mangrupa beurang ka-1. Kenalan heula, teu aya sidang!`,
      'system'
    );
    broadcastChat(roomCode,
      `🌅 Senja bakal datang... Sanekala bakal ngaliar. Ati-ati!`,
      'system'
    );
  } else {
    broadcastChat(roomCode,
      `☀️ Beurang ka-${room.dayCount} dimimitian! Diskusi jeung pilih saha Sanekala!`,
      'system'
    );
    if (room.lockedPlayers.length > 0) {
      broadcastChat(roomCode,
        `🔒 ${room.lockedPlayers.join(', ')} dikunci ku Kuncen! Teu bisa divote!`,
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
