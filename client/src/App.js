import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');

// ============================================================
// CONSTANTS
// ============================================================
const ROLES = {
  werewolf: {
    name: 'Sanekala',
    emoji: '👹',
    color: '#e94560',
    desc: 'Maneh nyaéta Sanekala! Siang nyamar jadi warga biasa. Senja berubah wujud & culik budak!',
    bg: 'rgba(233,69,96,0.15)',
    secret: true
  },
  seer: {
    name: 'Dukun',
    emoji: '🔮',
    color: '#9b59b6',
    desc: 'Maneh nyaéta Dukun! Unggal senja, intip jati diri hiji pamain. Maneh bisa ningali wujud asli Sanekala!',
    bg: 'rgba(155,89,182,0.15)',
    secret: false
  },
  doctor: {
    name: 'Kolot',
    emoji: '👴',
    color: '#2ecc71',
    desc: 'Maneh nyaéta Kolot! Unggal senja, jaga hiji budak tina culikan Sanekala. Bisa jaga diri sorangan!',
    bg: 'rgba(46,204,113,0.15)',
    secret: false
  },
  kuncen: {
    name: 'Kuncen',
    emoji: '🗝️',
    color: '#e67e22',
    desc: 'Maneh nyaéta Kuncen! Kebal 1x tina serangan Sanekala. Bisa ngunci 1 pamain tina sidang!',
    bg: 'rgba(230,126,34,0.15)',
    secret: false
  },
  ajengan: {
    name: 'Ajengan',
    emoji: '🕌',
    color: '#1abc9c',
    desc: 'Maneh nyaéta Ajengan! Lindungi warga jeung doa. 1x Ruqyah Massal: Sanekala teu bisa ngalakukeun aksi!',
    bg: 'rgba(26,188,156,0.15)',
    secret: false
  },
  villager: {
    name: 'Budak',
    emoji: '👦',
    color: '#f39c12',
    desc: 'Maneh nyaéta Budak! Target utama Sanekala. Gunakeun akal pikeun manggihan Sanekala di antara urang!',
    bg: 'rgba(243,156,18,0.15)',
    secret: false
  }
};

const PHASES = {
  siang: {
    label: 'Beurang - Sidang Lembur',
    emoji: '☀️',
    color: '#f39c12',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overlayBg: 'rgba(243,156,18,0.05)'
  },
  senja: {
    label: 'Senja - Sanekala Ngaliar',
    emoji: '🌅',
    color: '#e67e22',
    bg: 'linear-gradient(135deg, #2d1b00 0%, #8B4513 40%, #FF6B35 100%)',
    overlayBg: 'rgba(230,126,34,0.08)'
  },
  malam: {
    label: 'Peuting - Kaayaan Lembur',
    emoji: '🌙',
    color: '#9b59b6',
    bg: 'linear-gradient(135deg, #000000 0%, #0d0d1a 50%, #1a0a2e 100%)',
    overlayBg: 'rgba(155,89,182,0.08)'
  }
};

// Sound Manager
const sounds = {};
const soundFiles = ['siang','senja','malam','wolf','eliminated','vote','win','lose','countdown','join','transition'];
soundFiles.forEach(name => {
  sounds[name] = new Audio(`/sounds/${name}.mp3`);
  sounds[name].volume = 0.4;
  sounds[name].onerror = () => {};
});

const playSound = (name) => {
  try {
    if (sounds[name]) {
      sounds[name].currentTime = 0;
      sounds[name].play().catch(() => {});
    }
  } catch(e) {}
};

const stopAllSounds = () => {
  Object.values(sounds).forEach(s => {
    try { s.pause(); s.currentTime = 0; } catch(e) {}
  });
};

// ============================================================
// COMPONENTS
// ============================================================

// ── Countdown Overlay ──
function CountdownOverlay({ count }) {
  return (
    <div className="fullscreen-overlay countdown-overlay">
      <div className="countdown-content">
        <div className="countdown-label">Kaulinan Dimimitian</div>
        <div className="countdown-number" key={count}>{count}</div>
        <div className="countdown-sub">
          Siang geus datang... Sanekala nyamar di antara urang!
        </div>
      </div>
    </div>
  );
}

// ── Phase Transition Overlay ──
function TransitionOverlay({ from, to, duration }) {
  const [progress, setProgress] = useState(0);
  const phaseData = PHASES[to] || PHASES.siang;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + (100 / (duration * 10)), 100));
    }, 100);
    return () => clearInterval(interval);
  }, [duration]);

  const messages = {
    siang: '☀️ Panonpoe bijil... Warga ngumpul pikeun bersidang!',
    senja: '🌅 Azan Maghrib kadéngé... Sanekala mimiti ngaliar!',
    malam: '🌙 Peuting nutupan lembur... Naon anu kajadian?'
  };

  return (
    <div className="fullscreen-overlay transition-overlay"
      style={{ background: phaseData.bg }}>
      <div className="transition-content">
        <div className="transition-emoji">{phaseData.emoji}</div>
        <div className="transition-label" style={{ color: phaseData.color }}>
          {phaseData.label}
        </div>
        <div className="transition-message">{messages[to]}</div>
        <div className="transition-bar-bg">
          <div className="transition-bar-fill"
            style={{ width: `${progress}%`, background: phaseData.color }} />
        </div>
      </div>
    </div>
  );
}

// ── Role Reveal Overlay ──
function RoleRevealOverlay({ role, teammates, onDone }) {
  const [visible, setVisible] = useState(false);
  const roleData = ROLES[role];

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const timer = setTimeout(() => onDone(), 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fullscreen-overlay role-reveal-overlay">
      <div className={`role-reveal-card ${visible ? 'show' : ''}`}
        style={{ borderColor: roleData?.color, background: roleData?.bg }}>
        <div className="role-reveal-pretitle">Peran maneh nyaéta...</div>
        <div className="role-reveal-emoji">{roleData?.emoji}</div>
        <div className="role-reveal-name" style={{ color: roleData?.color }}>
          {roleData?.name}
        </div>
        <div className="role-reveal-desc">{roleData?.desc}</div>
        {teammates?.length > 0 && (
          <div className="role-reveal-teammates">
            👹 Batur Sanekala: {teammates.join(', ')}
          </div>
        )}
        <div className="role-reveal-timer">Nutup otomatis...</div>
      </div>
    </div>
  );
}

// ── Timer Component ──
function Timer({ duration, phase, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const phaseData = PHASES[phase] || PHASES.siang;

  useEffect(() => {
    setTimeLeft(duration);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        if (prev <= 10) playSound('countdown');
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, phase]);

  const percent = (timeLeft / duration) * 100;
  const urgent = timeLeft <= 10;
  const warning = timeLeft <= 20;
  const timerColor = urgent ? '#e94560' : warning ? '#f39c12' : phaseData.color;

  return (
    <div className={`timer-box ${urgent ? 'urgent' : ''}`}>
      <div className="timer-label">
        {urgent ? '⚠️ Waktu Ampir Béak!' : '⏱️ Sesa Waktu'}
      </div>
      <div className="timer-display" style={{ color: timerColor }}>
        <span className="timer-number">
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
          {String(timeLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="timer-bar-bg">
        <div className="timer-bar-fill"
          style={{
            width: `${percent}%`,
            background: timerColor,
            transition: 'width 1s linear, background 0.5s'
          }} />
      </div>
    </div>
  );
}

// ── Host Monitor Panel ──
function HostMonitor({ players, hostRoleInfo, phase, dayCount }) {
  return (
    <div className="host-monitor">
      <div className="host-monitor-title">👑 Monitor Host</div>
      <div className="host-monitor-phase">
        {PHASES[phase]?.emoji} {PHASES[phase]?.label || phase} - Ronde {dayCount}
      </div>
      <div className="host-player-list">
        {hostRoleInfo.map((p, i) => {
          const roleData = ROLES[p.role];
          const playerStatus = players.find(pl => pl.username === p.username);
          return (
            <div key={i} className={`host-player-item ${!playerStatus?.isAlive ? 'dead' : ''}`}>
              <span className="host-player-role">{roleData?.emoji}</span>
              <span className="host-player-name">{p.username}</span>
              <span className="host-player-role-name"
                style={{ color: roleData?.color }}>
                {roleData?.name}
              </span>
              <span className={`host-player-status ${!playerStatus?.isAlive ? 'dead' : 'alive'}`}>
                {playerStatus?.isAlive ? '●' : '✕'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function App() {
  // ── Screen State ──
  const [screen, setScreen] = useState('landing');

  // ── User State ──
  const [username, setUsername] = useState('');
  const [isHost, setIsHost] = useState(false);

  // ── Room State ──
  // eslint-disable-next-line no-unused-vars
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [currentRoom, setCurrentRoom] = useState('');
  const [currentRoomName, setCurrentRoomName] = useState('');
  const [players, setPlayers] = useState([]);
  const [joinCode, setJoinCode] = useState('');

  // ── Game State ──
  const [myRole, setMyRole] = useState('');
  const [teammates, setTeammates] = useState([]);
  const [sanekalaList, setSanekalaList] = useState([]);
  const [phase, setPhase] = useState('');
  const [isFirstDay, setIsFirstDay] = useState(true);
  const [dayCount, setDayCount] = useState(1);
  const [phaseMessage, setPhaseMessage] = useState('');
  const [phaseDuration, setPhaseDuration] = useState(60);

  // ── Action State ──
  const [nightTargets, setNightTargets] = useState([]);
  const [nightInstruction, setNightInstruction] = useState('');
  const [nightBlocked, setNightBlocked] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [kuncenMode, setKuncenMode] = useState('');
  const [actionConfirmed, setActionConfirmed] = useState('');
  const [ruqyahAvailable, setRuqyahAvailable] = useState(false);
  const [ruqyahUsed, setRuqyahUsed] = useState(false);

  // ── Vote State ──
  const [voteTargets, setVoteTargets] = useState([]);
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState('');
  const [lockedPlayers, setLockedPlayers] = useState([]);

  // ── Result State ──
  const [senjaResult, setSenjaResult] = useState(null);
  const [seerResult, setSeerResult] = useState(null);
  const [eliminatedInfo, setEliminatedInfo] = useState(null);
  const [ajenganWasiat, setAjenganWasiat] = useState('');

  // ── UI State ──
  const [countdown, setCountdown] = useState(null);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [transition, setTransition] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameOver, setGameOver] = useState(null);

  // ── Host State ──
  const [hostRoleInfo, setHostRoleInfo] = useState([]);

  const chatEndRef = useRef(null);
  const usernameRef = useRef('');
  const currentRoomRef = useRef('');
  const isHostRef = useRef(false);

  useEffect(() => { usernameRef.current = username; }, [username]);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const play = useCallback((name) => {
    if (soundEnabled) playSound(name);
  }, [soundEnabled]);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  // ── Socket Events ──
  useEffect(() => {
    // Room Events
    socket.on('roomCreated', ({ roomCode, roomName, maxPlayers }) => {
      setCurrentRoom(roomCode);
      setCurrentRoomName(roomName);
      setMaxPlayers(maxPlayers);
      setIsHost(true);
      socket.emit('setHostUsername', { roomCode, username: usernameRef.current });
      setScreen('lobby');
      play('join');
    });

    socket.on('roomJoined', ({ roomCode, roomName }) => {
      setCurrentRoom(roomCode);
      setCurrentRoomName(roomName);
      setScreen('lobby');
      play('join');
    });

    socket.on('roomUpdated', ({ maxPlayers }) => {
      setMaxPlayers(maxPlayers);
    });

    socket.on('playerList', setPlayers);

    socket.on('hostInfo', ({ username }) => {
      // Host info received
    });

    socket.on('kicked', ({ message }) => {
      showError(message);
      setScreen('landing');
      setCurrentRoom('');
      setPlayers([]);
    });

    socket.on('hostDisconnected', ({ message }) => {
      showError(message);
    });

    // Game Events
    socket.on('gameCountdown', ({ count }) => {
      setCountdown(count);
      play('countdown');
    });

    socket.on('gameStarted', ({ players, dayCount }) => {
      setPlayers(players);
      setDayCount(dayCount || 1);
      setChatMessages([]);
      setCountdown(null);
      setScreen('game');
    });

    socket.on('yourRole', ({ role, teammates }) => {
      setMyRole(role);
      setTeammates(teammates || []);
      setTimeout(() => {
        setShowRoleReveal(true);
        if (role === 'werewolf') play('wolf');
      }, 500);
    });

    socket.on('hostRoleInfo', ({ players }) => {
      setHostRoleInfo(players);
    });

    socket.on('sanekalaList', (list) => {
      setSanekalaList(list);
    });

    // Phase Events
    socket.on('phaseChange', ({ phase, dayCount, duration, message, voteTargets, lockedPlayers, killed, protectedBy, lockedPlayer, isFirstDay }) => {
  setPhase(phase);
  setDayCount(dayCount || 1);
  setPhaseDuration(duration || 60);
  setPhaseMessage(message || '');
  setActionConfirmed('');
  setSeerResult(null);
  setEliminatedInfo(null);
  setKuncenMode('');

  if (phase === 'siang') {
    setMyVote('');
    setVotes({});
    setVoteTargets(voteTargets || []);
    setLockedPlayers(lockedPlayers || []);
    setSenjaResult(null);
    setIsFirstDay(isFirstDay || false);
    stopAllSounds();
    play('siang');
  }

      if (phase === 'senja') {
        setNightTargets([]);
        setNightInstruction('');
        setNightBlocked(false);
        stopAllSounds();
        play('senja');
      }

      if (phase === 'malam') {
        setSenjaResult({ killed, protectedBy, lockedPlayer });
        stopAllSounds();
        play('malam');
        if (killed) play('eliminated');
      }
    });

    socket.on('phaseTransition', ({ from, to, duration, data }) => {
      setTransition({ from, to, duration, data });
      play('transition');
      setTimeout(() => setTransition(null), duration * 1000);
    });

    // Night Events
    socket.on('nightInstruction', ({ message, targets, blocked, hasShield, ruqyahAvailable }) => {
      setNightInstruction(message);
      setNightTargets(targets || []);
      setNightBlocked(blocked || false);
      setHasShield(hasShield || false);
      setRuqyahAvailable(ruqyahAvailable || false);
    });

    socket.on('actionConfirmed', ({ message }) => {
      setActionConfirmed(message);
      setNightTargets([]);
      setNightBlocked(true);
    });

    socket.on('seerResult', ({ target, role, isSanekala }) => {
      setSeerResult({ target, role, isSanekala });
    });

    socket.on('senjaResult', ({ killed, protectedBy, lockedPlayer, players }) => {
      setPlayers(players);
    });

    socket.on('ruqyahMassalActivated', ({ username, message }) => {
      setRuqyahUsed(true);
      setChatMessages(prev => [...prev, {
        username: 'Lembur',
        message,
        type: 'system',
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    socket.on('ajenganRevealed', ({ username, message }) => {
      showError(message);
    });

    socket.on('ajenganWasiat', ({ message }) => {
      setAjenganWasiat(message);
    });

    // Vote Events
    socket.on('voteUpdate', ({ votes, lockedPlayers }) => {
      setVotes(votes);
      setLockedPlayers(lockedPlayers || []);
      play('vote');
    });

    socket.on('playerEliminated', ({ username, role, players }) => {
      setPlayers(players);
      setEliminatedInfo({ username, role });
      play('eliminated');
    });

    // Chat Events
    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    // Game Over Events
    socket.on('gameOver', (data) => {
      setGameOver(data);
      stopAllSounds();
      if (data.winner === 'warga') play('win');
      else play('lose');
      setScreen('gameover');
    });

    socket.on('gameEnded', ({ message }) => {
      setScreen('lobby');
      setPhase('');
      setMyRole('');
      setGameOver(null);
      setSenjaResult(null);
      setChatMessages([]);
      showError(message);
    });

    socket.on('gameRestarted', ({ players, message }) => {
      setPlayers(players);
      setPhase('');
      setMyRole('');
      setGameOver(null);
      setSenjaResult(null);
      setChatMessages([]);
      setScreen('lobby');
    });

     socket.on('gameError', ({ message }) => {
      showError(message);
    });

    return () => {
      ['roomCreated','roomJoined','roomUpdated','playerList','hostInfo',
       'kicked','hostDisconnected','gameCountdown','gameStarted','yourRole',
       'hostRoleInfo','sanekalaList','phaseChange','phaseTransition',
       'nightInstruction','actionConfirmed','seerResult','senjaResult',
       'ruqyahMassalActivated','ajenganRevealed','ajenganWasiat',
       'voteUpdate','playerEliminated','chatMessage','gameOver',
       'gameEnded','gameRestarted','gameError'
      ].forEach(e => socket.off(e));
    };
  }, [play]);

  // ── Actions ──
const createRoom = () => {
    if (!username.trim()) return showError('Eusi ngaran heula!');
    if (!roomName.trim()) return showError('Eusi ngaran rohangan heula!');
    // Set username dulu sebelum create room
    socket.emit('createRoom', {
      roomName: roomName.trim(),
      maxPlayers,
      hostUsername: username.trim()
    });
  };

  const joinRoom = () => {
    if (!username.trim()) return showError('Eusi ngaran heula!');
    if (!joinCode.trim()) return showError('Eusi kode rohangan heula!');
    socket.emit('joinRoom', { roomCode: joinCode.toUpperCase(), username });
  };

  const startGame = () => socket.emit('startGame', currentRoom);

  const endGame = () => {
    if (window.confirm('Yakin rék ngakhiran kaulinan?')) {
      socket.emit('endGame', currentRoom);
    }
  };

  const restartGame = () => socket.emit('restartGame', currentRoom);

  const kickPlayer = (username) => {
    if (window.confirm(`Kick ${username}?`)) {
      socket.emit('kickPlayer', { roomCode: currentRoom, username });
    }
  };

  const sendNightAction = (target, actionType = 'default') => {
    socket.emit('nightAction', {
      roomCode: currentRoom,
      targetUsername: target,
      actionType
    });
    setKuncenMode('');
  };

  const castVote = (target) => {
    if (myVote) return;
    if (lockedPlayers.includes(target)) {
      return showError(`${target} dikunci ku Kuncen!`);
    }
    setMyVote(target);
    socket.emit('castVote', { roomCode: currentRoom, targetUsername: target });
  };

  const activateRuqyah = () => {
    socket.emit('ruqyahMassal', { roomCode: currentRoom });
    setRuqyahUsed(true);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('sendChat', { roomCode: currentRoom, message: chatInput });
    setChatInput('');
  };

  // ── Computed ──
  const myPlayer = players.find(p => p.username === username);
  const isAlive = myPlayer?.isAlive ?? true;
  const roleData = ROLES[myRole];
  const phaseData = PHASES[phase];
  const canChat = (phase === 'siang' && isAlive) ||
    (phase === 'senja' && myRole === 'werewolf' && isAlive);

  // ── Render Overlays ──
  if (countdown !== null) return <CountdownOverlay count={countdown} />;
  if (transition) return (
    <TransitionOverlay
      from={transition.from}
      to={transition.to}
      duration={transition.duration}
    />
  );

  // ============================================================
  // SCREEN: LANDING
  // ============================================================
  if (screen === 'landing') return (
    <div className="landing-screen">
      <div className="landing-bg-overlay" />

      <div className="landing-content">
        {/* Hero */}
        <div className="landing-hero">
          <div className="landing-logo">👹</div>
          <h1 className="landing-title">Sandekala Village</h1>
          <p className="landing-subtitle">Saha Sanekala di antara urang?</p>
          <p className="landing-subtitle-id">Siapakah Sanekala di antara kita?</p>
        </div>

        {/* Role Preview */}
        <div className="landing-roles">
          {Object.entries(ROLES).map(([key, r]) => (
            <div key={key} className="landing-role-chip"
              style={{ borderColor: r.color, background: r.bg }}>
              <span>{r.emoji}</span>
              <span style={{ color: r.color }}>{r.name}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="landing-actions">
          <button
            className="btn-primary btn-large"
            onClick={() => setScreen('create')}
          >
            🏠 Jieun Rohangan
          </button>
          <button
            className="btn-secondary btn-large"
            onClick={() => setScreen('join')}
          >
            🚪 Asup Rohangan
          </button>
        </div>

        {/* Sound Toggle */}
        <button
          className="sound-toggle-btn"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );

  // ============================================================
  // SCREEN: CREATE ROOM
  // ============================================================
  if (screen === 'create') return (
    <div className="form-screen">
      <div className="form-card">
        <button className="back-btn" onClick={() => setScreen('landing')}>
          ← Balik
        </button>

        <div className="form-header">
          <div className="form-icon">🏠</div>
          <h2>Jieun Rohangan Anyar</h2>
          <p>Buat ruangan baru untuk bermain</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="form-group">
          <label>👤 Ngaran Maneh (Nama Kamu)</label>
          <input
            placeholder="Lebetkeun ngaran..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label>🏠 Ngaran Rohangan (Nama Ruangan)</label>
          <input
            placeholder="Lebetkeun ngaran rohangan..."
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            maxLength={30}
          />
        </div>

        <div className="form-group">
          <label>👥 Jumlah Pamain Maksimal ({maxPlayers} urang)</label>
          <div className="slider-container">
            <input
              type="range"
              min={3} max={20}
              value={maxPlayers}
              onChange={e => setMaxPlayers(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>3</span>
              <span className="slider-value">{maxPlayers}</span>
              <span>20</span>
            </div>
          </div>
          <div className="role-preview-info">
            {getRolePreview(maxPlayers)}
          </div>
        </div>

        <button className="btn-primary" onClick={createRoom}>
          🏠 Jieun Rohangan
        </button>
      </div>
    </div>
  );

  // ============================================================
  // SCREEN: JOIN ROOM
  // ============================================================
  if (screen === 'join') return (
    <div className="form-screen">
      <div className="form-card">
        <button className="back-btn" onClick={() => setScreen('landing')}>
          ← Balik
        </button>

        <div className="form-header">
          <div className="form-icon">🚪</div>
          <h2>Asup Rohangan</h2>
          <p>Masuk ke ruangan yang sudah ada</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="form-group">
          <label>👤 Ngaran Maneh (Nama Kamu)</label>
          <input
            placeholder="Lebetkeun ngaran..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label>🔑 Kode Rohangan (Kode Ruangan)</label>
          <input
            placeholder="Contoh: ABC123"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="code-input"
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
          />
        </div>

        <button className="btn-primary" onClick={joinRoom}>
          🚪 Asup Rohangan
        </button>
      </div>
    </div>
  );

  // ============================================================
  // SCREEN: LOBBY
  // ============================================================
  if (screen === 'lobby') return (
    <div className="lobby-screen">
      <div className="lobby-card">
        {/* Header */}
        <div className="lobby-header">
          <div className="lobby-title">
            <span className="lobby-icon">⚖️</span>
            <div>
              <h1>Sandekala Village</h1>
              <p className="lobby-room-name">{currentRoomName}</p>
            </div>
          </div>
          {isHost && <span className="host-badge">👑 Host</span>}
        </div>

        {/* Room Code */}
        <div className="room-code-section">
          <p className="room-code-label">Kode Rohangan:</p>
          <div className="room-code-display">{currentRoom}</div>
          <p className="room-code-hint">Bagikeun kode ieu ka babaturan maneh</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Host Controls */}
        {isHost && (
          <div className="host-controls">
            <div className="host-controls-title">⚙️ Setelan Host</div>
            <div className="form-group">
              <label>👥 Maksimal Pamain ({maxPlayers} urang)</label>
              <div className="slider-container">
                <input
                  type="range" min={3} max={20}
                  value={maxPlayers}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setMaxPlayers(val);
                    socket.emit('updateMaxPlayers', {
                      roomCode: currentRoom,
                      maxPlayers: val
                    });
                  }}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>3</span>
                  <span className="slider-value">{maxPlayers}</span>
                  <span>20</span>
                </div>
              </div>
              <div className="role-preview-info">
                {getRolePreview(maxPlayers)}
              </div>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="players-section">
          <h3>👥 Urang Lembur ({players.length}/{maxPlayers})</h3>
          <ul className="players-list">
            {players.map((p, i) => (
              <li key={i} className="player-item">
                <span className="player-name">
                  👤 {p.username}
                  {p.username === username && (
                    <span className="you-badge">Maneh</span>
                  )}
                </span>
                {isHost && p.username !== username && (
                  <button
                    className="kick-btn"
                    onClick={() => kickPlayer(p.username)}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Role Info */}
        <div className="role-info-section">
          <h3>📋 Peran anu bakal aya:</h3>
          <div className="role-chips">
            {Object.entries(ROLES).map(([key, r]) => (
              <div key={key} className="role-chip"
                style={{ borderColor: r.color, background: r.bg }}>
                {r.emoji} <span style={{ color: r.color }}>{r.name}</span>
              </div>
            ))}
          </div>
          <div className="role-requirements">
            <p>🎮 Minimal 3 pamain pikeun mimitian</p>
            <p>🔮 Dukun: 4+ pamain</p>
            <p>👴 Kolot: 6+ pamain</p>
            <p>🗝️ Kuncen: 7+ pamain</p>
            <p>🕌 Ajengan: 8+ pamain</p>
          </div>
        </div>

        {/* Start Button (Host Only) */}
        {isHost ? (
          <button
            className="btn-primary btn-start"
            onClick={startGame}
            disabled={players.length < 3}
          >
            {players.length < 3
              ? `Kurang ${3 - players.length} pamain deui`
              : '🎮 Mimitian Kaulinan!'}
          </button>
        ) : (
          <div className="waiting-host">
            ⏳ Ngantosan host mimitian kaulinan...
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // SCREEN: GAME
  // ============================================================
  if (screen === 'game') return (
    <div className="game-screen"
      style={{ background: phaseData?.bg || '#1a1a2e' }}>

      {/* Role Reveal */}
      {showRoleReveal && (
        <RoleRevealOverlay
          role={myRole}
          teammates={teammates}
          onDone={() => setShowRoleReveal(false)}
        />
      )}

      {/* Game Layout */}
      <div className="game-layout">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">

          {/* Phase Header */}
          <div className="panel-card phase-card"
            style={{ borderColor: phaseData?.color }}>
            <div className="phase-title" style={{ color: phaseData?.color }}>
              {phaseData?.emoji} {phaseData?.label}
            </div>
            <div className="phase-day">Ronde {dayCount}</div>
            {phaseMessage && (
              <div className="phase-message">{phaseMessage}</div>
            )}
            {phase && phase !== 'malam' && (
              <Timer
                key={`${phase}-${dayCount}`}
                duration={phaseDuration}
                phase={phase}
              />
            )}
          </div>

          {/* Role Card */}
          {roleData && !isHost && (
            <div className="panel-card role-card"
              style={{ borderColor: roleData.color, background: roleData.bg }}>
              <div className="role-card-header">
                <span className="role-card-label">PERAN MANEH</span>
                {myRole === 'werewolf' && (
                  <span className="sanekala-badge">👹 SANEKALA</span>
                )}
              </div>
              <div className="role-card-main">
                <span className="role-card-emoji">{roleData.emoji}</span>
                <span className="role-card-name"
                  style={{ color: roleData.color }}>
                  {roleData.name}
                </span>
              </div>
              <div className="role-card-desc">{roleData.desc}</div>

              {/* Sanekala: tampilkan sesama sanekala */}
              {myRole === 'werewolf' && sanekalaList.length > 0 && (
                <div className="sanekala-team">
                  <div className="sanekala-team-title">
                    👹 Batur Sanekala (Ngan maneh anu bisa ningali ieu):
                  </div>
                  {sanekalaList.map((s, i) => (
                    <div key={i} className={`sanekala-member ${!s.isAlive ? 'dead' : ''}`}>
                      <span className="sanekala-icon">👹</span>
                      <span>{s.username}</span>
                      {!s.isAlive && <span className="dead-tag">Tilar</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Kuncen shield status */}
              {myRole === 'kuncen' && (
                <div className="kuncen-shield-status">
                  {hasShield
                    ? '🛡️ Kebal masih aktif'
                    : '🛡️ Kebal geus dipake'}
                </div>
              )}

              {/* Ajengan ruqyah status */}
              {myRole === 'ajengan' && (
                <div className="ajengan-ruqyah-status">
                  {!ruqyahUsed
                    ? '🕌 Ruqyah Massal: Sadia'
                    : '🕌 Ruqyah Massal: Geus dipake'}
                </div>
              )}
            </div>
          )}

          {/* Host Monitor */}
          {isHost && hostRoleInfo.length > 0 && (
            <HostMonitor
              players={players}
              hostRoleInfo={hostRoleInfo}
              phase={phase}
              dayCount={dayCount}
            />
          )}

          {/* ── SENJA ACTIONS ── */}
          {phase === 'senja' && isAlive && !isHost && (
            <>
              {/* Sanekala */}
              {myRole === 'werewolf' && !nightBlocked && !actionConfirmed && (
                <div className="panel-card action-card sanekala-action">
                  <div className="action-label">👹 AKSI SANEKALA</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn sanekala-target"
                        onClick={() => sendNightAction(t)}>
                        👦 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {myRole === 'werewolf' && nightBlocked && !actionConfirmed && (
                <div className="panel-card action-card blocked-action">
                  <div className="action-label">🕌 DIBLOKIR RUQYAH</div>
                  <p>Ruqyah Massal Ajengan ngahalangan aksi maneh senja ieu!</p>
                </div>
              )}

              {/* Dukun */}
              {myRole === 'seer' && !actionConfirmed && (
                <div className="panel-card action-card seer-action">
                  <div className="action-label">🔮 AKSI DUKUN</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn seer-target"
                        onClick={() => sendNightAction(t)}>
                        👤 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kolot */}
              {myRole === 'doctor' && !actionConfirmed && (
                <div className="panel-card action-card doctor-action">
                  <div className="action-label">👴 AKSI KOLOT</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn doctor-target"
                        onClick={() => sendNightAction(t)}>
                        👦 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kuncen */}
              {myRole === 'kuncen' && !actionConfirmed && (
                <div className="panel-card action-card kuncen-action">
                  <div className="action-label">🗝️ AKSI KUNCEN</div>
                  {!kuncenMode ? (
                    <>
                      <p className="action-instruction">{nightInstruction}</p>
                      {hasShield && (
                        <button className="target-btn kuncen-target"
                          onClick={() => setKuncenMode('shield')}>
                          🛡️ Gunakeun Kebal (Lindungi diri)
                        </button>
                      )}
                      <button className="target-btn kuncen-target"
                        onClick={() => setKuncenMode('lock')}>
                        🔒 Kunci Pamain (Skip vote)
                      </button>
                    </>
                  ) : kuncenMode === 'shield' ? (
                    <>
                      <p>Konfirmasi gunakeun kebal?</p>
                      <button className="target-btn kuncen-target"
                        onClick={() => sendNightAction(username, 'shield')}>
                        🛡️ Aktifkeun Kebal!
                      </button>
                      <button className="back-small-btn"
                        onClick={() => setKuncenMode('')}>
                        ← Balik
                      </button>
                    </>
                  ) : (
                    <>
                      <p>Pilih saha anu rék dikunci:</p>
                      <div className="target-grid">
                        {nightTargets.map((t, i) => (
                          <button key={i} className="target-btn kuncen-target"
                            onClick={() => sendNightAction(t, 'lock')}>
                            🔒 {t}
                          </button>
                        ))}
                      </div>
                      <button className="back-small-btn"
                        onClick={() => setKuncenMode('')}>
                        ← Balik
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Ajengan */}
              {myRole === 'ajengan' && !actionConfirmed && (
                <div className="panel-card action-card ajengan-action">
                  <div className="action-label">🕌 AKSI AJENGAN</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  {ruqyahAvailable && !ruqyahUsed && (
                    <button className="ruqyah-btn" onClick={activateRuqyah}>
                      ✨ Aktifkeun Ruqyah Massal!
                      <span className="ruqyah-warning">
                        ⚠️ Sanekala bakal nyaho maneh Ajengan!
                      </span>
                    </button>
                  )}
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn ajengan-target"
                        onClick={() => sendNightAction(t)}>
                        🙏 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Budak / Villager */}
              {myRole === 'villager' && (
                <div className="panel-card action-card villager-night">
                  <div className="action-label">👦 SENJA MENCEKAM</div>
                  <p>Geura balik ka imah! Senja geus datang!</p>
                  <p className="small-text">
                    Sanekala, Dukun, Kolot, Kuncen, jeung Ajengan keur ngalakukeun aksi...
                  </p>
                </div>
              )}

              {/* Action Confirmed */}
              {actionConfirmed && (
                <div className="panel-card confirmed-card">
                  ✅ {actionConfirmed}
                </div>
              )}
            </>
          )}

          {/* ── SIANG ACTIONS ── */}
          {phase === 'siang' && !isHost && (
  <>
    {/* Hari Pertama - Tidak ada vote */}
    {isFirstDay && isAlive && (
      <div className="panel-card first-day-card">
        <div className="action-label">☀️ BEURANG KAHIJI</div>
        <div className="first-day-content">
          <div className="first-day-emoji">🌅</div>
          <p className="first-day-title">Wilujeng Sumping!</p>
          <p className="first-day-desc">
            Ieu mangrupa beurang kahiji di lembur.
            Kenalan heula jeung batur saméméh senja datang!
          </p>
          <p className="first-day-desc">
            Teu aya sidang ayeuna. Senja bakal datang...
            Sanekala bakal ngaliar!
          </p>
          <div className="first-day-warning">
            ⚠️ Ati-ati! Sanekala aya di antara urang!
          </div>
        </div>
      </div>
    )}

    {/* Ajengan Ruqyah Massal Button */}
    {!isFirstDay && myRole === 'ajengan' && isAlive && !ruqyahUsed && (
                <div className="panel-card action-card ajengan-action">
                  <div className="action-label">🕌 RUQYAH MASSAL</div>
                  <p>Gunakeun Ruqyah Massal pikeun ngahalangan Sanekala senja ieu!</p>
                  <button className="ruqyah-btn" onClick={activateRuqyah}>
                    ✨ Aktifkeun Ruqyah Massal!
                    <span className="ruqyah-warning">
                      ⚠️ Sanekala bakal nyaho maneh Ajengan!
                    </span>
                  </button>
                </div>
              )}

              {/* Voting - hanya hari ke-2 dst */}
                  {!isFirstDay && isAlive && !myVote && voteTargets.length > 0 && (
                  <div className="panel-card action-card vote-card">
                  <div className="action-label">🗳️ SIDANG LEMBUR</div>
                  <p className="action-instruction">
                    Saha anu maneh curiga jadi Sanekala?
                  </p>
                  {lockedPlayers.length > 0 && (
                    <div className="locked-notice">
                      🔒 {lockedPlayers.join(', ')} dikunci ku Kuncen!
                    </div>
                  )}
                  <div className="target-grid">
                    {voteTargets.map((t, i) => (
                      <button key={i}
                        className={`target-btn vote-target ${lockedPlayers.includes(t) ? 'locked' : ''}`}
                        onClick={() => castVote(t)}
                        disabled={lockedPlayers.includes(t)}
                      >
                        {lockedPlayers.includes(t) ? '🔒' : '🪓'} {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isFirstDay && myVote && (
                <div className="panel-card confirmed-card">
                  ✅ Maneh milih ngusir: <strong>{myVote}</strong>
                </div>
              )}

              {/* Vote Tracker */}
              {!isFirstDay && Object.keys(votes).length > 0 && (
                <div className="panel-card vote-tracker-card">
                  <div className="action-label">📊 HASIL PILIHAN</div>
                  {Object.entries(votes).map(([voter, target], i) => (
                    <div key={i} className="vote-row">
                      <span>👤 {voter}</span>
                      <span className="vote-arrow">→</span>
                      <span>🪓 {target}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── MALAM RESULTS ── */}
          {phase === 'malam' && senjaResult && (
            <div className="panel-card malam-result-card">
              <div className="action-label">🌙 KAAYAAN LEMBUR</div>
              {senjaResult.killed ? (
                <div className="result-killed">
                  😱 <strong>{senjaResult.killed}</strong> kapanggih leungit!
                  <br />Diculik ku Sanekala!
                </div>
              ) : (
                <div className="result-safe">
                  🎉 Sadaya urang salamet senja ieu!
                </div>
              )}
              {senjaResult.protectedBy && (
                <div className="result-protected">
                  🛡️ Hiji urang diselamatkeun ku{' '}
                  {senjaResult.protectedBy === 'kolot' ? 'Kolot 👴'
                    : senjaResult.protectedBy === 'ajengan' ? 'Ajengan 🕌'
                    : 'Kuncen 🗝️'}!
                </div>
              )}
              {senjaResult.lockedPlayer && (
                <div className="result-locked">
                  🔒 <strong>{senjaResult.lockedPlayer}</strong> dikunci ku Kuncen!
                  Teu bisa divote ronde ieu!
                </div>
              )}
            </div>
          )}

          {/* Seer Result */}
          {seerResult && (
            <div className="panel-card seer-result-card">
              <div className="action-label">🔮 PANON DUKUN</div>
              <p>
                <strong>{seerResult.target}</strong> téh nyaéta{' '}
                <strong style={{ color: ROLES[seerResult.role]?.color }}>
                  {ROLES[seerResult.role]?.emoji} {ROLES[seerResult.role]?.name}
                </strong>!
              </p>
              {seerResult.isSanekala && (
                <p className="warning-text">
                  ⚠️ Manéhna téh Sanekala! Ati-ati!
                </p>
              )}
            </div>
          )}

          {/* Eliminated Info */}
          {eliminatedInfo && (
            <div className="panel-card eliminated-card">
              <div className="action-label">⚖️ KAPUTUSAN SIDANG</div>
              <p>
                🪓 <strong>{eliminatedInfo.username}</strong> diusir tina lembur!
                <br />Manéhna téh{' '}
                <strong style={{ color: ROLES[eliminatedInfo.role]?.color }}>
                  {ROLES[eliminatedInfo.role]?.emoji} {ROLES[eliminatedInfo.role]?.name}
                </strong>!
              </p>
            </div>
          )}

          {/* Ajengan Wasiat */}
          {ajenganWasiat && (
            <div className="panel-card wasiat-card">
              <div className="action-label">📜 WASIAT AJENGAN</div>
              <p>{ajenganWasiat}</p>
            </div>
          )}

          {/* Dead Player */}
          {!isAlive && !isHost && (
            <div className="panel-card dead-card">
              💀 Maneh geus tilar dunya...
              <br />Saksian wé jalannya kaulinan
            </div>
          )}

          {/* Host Controls in Game */}
          {isHost && (
            <div className="panel-card host-game-controls">
              <div className="action-label">👑 KONTROL HOST</div>
              <button className="btn-danger" onClick={endGame}>
                ⏹️ Akhiri Kaulinan
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">

          {/* Players */}
          <div className="panel-card players-card">
            <h3>👥 Urang Lembur
              <span className="alive-count">
                ({players.filter(p => p.isAlive).length} hirup)
              </span>
            </h3>
            <ul className="game-players-list">
              {players.map((p, i) => {
                const isSanekala = myRole === 'werewolf' &&
                  sanekalaList.find(s => s.username === p.username);
                return (
                  <li key={i} className={`game-player-item ${!p.isAlive ? 'dead' : ''} ${p.isLocked ? 'locked' : ''}`}>
                    <span className="game-player-icon">
                      {!p.isAlive ? '💀' : isSanekala ? '👹' : '👤'}
                    </span>
                    <span className="game-player-name">
                      {p.username}
                      {p.username === username && (
                        <span className="you-tag">(Maneh)</span>
                      )}
                    </span>
                    <div className="game-player-badges">
                      {isSanekala && p.isAlive && (
                        <span className="sanekala-tag">👹</span>
                      )}
                      {p.isLocked && (
                        <span className="locked-tag">🔒</span>
                      )}
                      {!p.isAlive && (
                        <span className="dead-tag-sm">Tilar</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Chat */}
          <div className="panel-card chat-card">
            <div className="chat-header">
              <h3>
                {phase === 'senja' && myRole === 'werewolf'
                  ? '👹 Bisikan Sanekala'
                  : phase === 'senja'
                  ? '🌅 Senja Jempe...'
                  : '☀️ Obrolan Lembur'}
              </h3>
              {phase === 'senja' && myRole === 'werewolf' && (
                <span className="chat-private-badge">🔒 Privat</span>
              )}
            </div>

            <div className="chat-messages" ref={chatEndRef}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-msg chat-${msg.type}`}>
                  {msg.type !== 'system' && (
                    <span className="chat-username"
                      style={{ color: msg.type === 'sanekala' ? '#e94560' : '#f39c12' }}>
                      {msg.type === 'sanekala' ? '👹' : '👤'} {msg.username}
                    </span>
                  )}
                  <span className="chat-text">{msg.message}</span>
                  <span className="chat-time">{msg.timestamp}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {canChat ? (
              <div className="chat-input-row">
                <input
                  className="chat-input"
                  placeholder={
                    phase === 'senja'
                      ? 'Bisik ka batur Sanekala...'
                      : 'Omongkeun pamadegan maneh...'
                  }
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                />
                <button className="chat-send-btn" onClick={sendChat}>
                  Kirim
                </button>
              </div>
            ) : (
              <div className="chat-disabled">
                {phase === 'senja'
                  ? '🌅 Jempe... senja keur mencekam'
                  : phase === 'malam'
                  ? '🌙 Peuting... ngantosan beurang'
                  : '💀 Arwah maneh teu bisa ngomong'}
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            className="sound-toggle-btn-game"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? '🔊 Suara ON' : '🔇 Suara OFF'}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // SCREEN: GAME OVER
  // ============================================================
  if (screen === 'gameover') return (
    <div className="gameover-screen"
      style={{
        background: gameOver?.winner === 'warga'
          ? 'linear-gradient(135deg, #0a2e0a, #1a4a1a, #0a2e0a)'
          : 'linear-gradient(135deg, #2e0a0a, #4a1a1a, #2e0a0a)'
      }}>
      <div className="gameover-card">
        {/* Result */}
        <div className="gameover-result">
          <div className="gameover-emoji">
            {gameOver?.winner === 'warga' ? '🏆' : '👹'}
          </div>
          <h1 style={{ color: gameOver?.winner === 'warga' ? '#2ecc71' : '#e94560' }}>
            {gameOver?.winner === 'warga'
              ? 'Urang Lembur Meunang!'
              : 'Sanekala Meunang!'}
          </h1>
          <div className="gameover-message">{gameOver?.message}</div>
        </div>

        {/* Role Reveal */}
        <div className="role-reveal-section">
          <h3>📋 Jati Diri Sadaya Pamain:</h3>
          <div className="role-reveal-list">
            {gameOver?.roleReveal?.map((p, i) => {
              const r = ROLES[p.role];
              return (
                <div key={i}
                  className={`role-reveal-item ${!p.isAlive ? 'dead' : ''}`}
                  style={{ borderColor: r?.color }}>
                  <span>{p.isAlive ? '👤' : '💀'} {p.username}</span>
                  <span style={{ color: r?.color }}>
                    {r?.emoji} {r?.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Controls */}
        {isHost ? (
          <div className="gameover-host-controls">
            <button className="btn-primary" onClick={restartGame}>
              🔄 Ulin Deui!
            </button>
            <button className="btn-secondary" onClick={endGame}>
              🏠 Balik ka Lobby
            </button>
          </div>
        ) : (
          <div className="waiting-host">
            ⏳ Ngantosan host pikeun mimitian deui...
          </div>
        )}
      </div>
    </div>
  );

  return null;
}

// ── Helper: Role Preview ──
function getRolePreview(count) {
  const roles = [];
  const sanekalaCount = count <= 5 ? 1
    : count <= 8 ? 2
    : count <= 12 ? 3
    : count <= 16 ? 4
    : 5;
  for (let i = 0; i < sanekalaCount; i++) roles.push('👹 Sanekala');
  if (count >= 4) roles.push('🔮 Dukun');
  if (count >= 6) roles.push('👴 Kolot');
  if (count >= 7) roles.push('🗝️ Kuncen');
  if (count >= 8) roles.push('🕌 Ajengan');
  const villagerCount = count - roles.length;
  for (let i = 0; i < villagerCount; i++) roles.push('👦 Budak');

  return (
    <div className="role-preview-chips">
      {roles.map((r, i) => (
        <span key={i} className="role-preview-chip">{r}</span>
      ))}
    </div>
  );
}

export default App;
