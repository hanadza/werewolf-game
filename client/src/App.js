import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './App.css';
import { ROLES, PHASES } from './constants/gameConfig';
import { playSound, stopAllSounds } from './utils/soundManager';
import CountdownOverlay from './components/CountdownOverlay';
import TransitionOverlay from './components/TransitionOverlay';
import EliminatedOverlay from './components/EliminatedOverlay';
import KidnapOverlay from './components/KidnapOverlay';
import EncyclopediaModal from './components/EncyclopediaModal';
import LandingScene from './scenes/LandingScene';
import CreateRoomScene from './scenes/CreateRoomScene';
import JoinRoomScene from './scenes/JoinRoomScene';
import LobbyScene from './scenes/LobbyScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001');

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
  const [isPrivate, setIsPrivate] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);

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
  const [showEliminatedOverlay, setShowEliminatedOverlay] = useState(false);
  const [showKidnapOverlay, setShowKidnapOverlay] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [kidnapTarget, setKidnapTarget] = useState(null);
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
    // Request public rooms when on landing screen
    if (screen === 'landing') {
      socket.emit('getPublicRooms');
      const interval = setInterval(() => socket.emit('getPublicRooms'), 5000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  useEffect(() => {
    // Room Events
    socket.on('publicRoomsList', setPublicRooms);
    socket.on('roomCreated', ({ roomCode, roomName, maxPlayers }) => {
      setCurrentRoom(roomCode);
      setCurrentRoomName(roomName);
      setMaxPlayers(maxPlayers);
      setIsHost(true);
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

    socket.on('roomVisibilityUpdated', ({ isPrivate }) => {
      setIsPrivate(isPrivate);
    });

    socket.on('hostTransferred', ({ newHostUsername }) => {
      setUsername(prev => {
        setIsHost(prev === newHostUsername);
        return prev;
      });
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
  setEliminatedInfo(null);
  setKuncenMode('');

  if (phase === 'siang') {
    setMyVote('');
    setVotes({});
    setVoteTargets(voteTargets || []);
    setLockedPlayers(lockedPlayers || []);
    setSenjaResult(null);
    setSeerResult(null);
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
        if (killed) {
          setKidnapTarget(killed);
          setShowKidnapOverlay(true);
        }
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
      setShowEliminatedOverlay(true);
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
      hostUsername: username.trim(),
      isPrivate
    });
  };

  const joinRoom = (code) => {
    const targetCode = typeof code === 'string' ? code : joinCode;
    if (!username.trim()) return showError('Eusi ngaran heula!');
    if (!targetCode.trim()) return showError('Eusi kode rohangan heula!');
    socket.emit('joinRoom', { roomCode: targetCode.toUpperCase(), username });
  };

  const leaveRoom = () => {
    if (window.confirm('Yakin rek balik ka menu utama?')) {
      socket.emit('leaveRoom');
      setScreen('landing');
      setCurrentRoom('');
      setPlayers([]);
    }
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

  const transferHost = (targetUsername) => {
    if (window.confirm(`Jadikeun ${targetUsername} host anyar?`)) {
      socket.emit('transferHost', { roomCode: currentRoom, targetUsername });
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

  const state = {
    screen, setScreen, username, setUsername, isHost, setIsHost,
    roomName, setRoomName, maxPlayers, setMaxPlayers, currentRoom, currentRoomName,
    players, joinCode, setJoinCode, myRole, teammates, sanekalaList, phase,
    isFirstDay, dayCount, phaseMessage, phaseDuration, nightTargets, nightInstruction,
    nightBlocked, hasShield, kuncenMode, setKuncenMode, actionConfirmed, ruqyahAvailable,
    ruqyahUsed, voteTargets, votes, myVote, lockedPlayers, senjaResult, seerResult,
    eliminatedInfo, ajenganWasiat, countdown, showRoleReveal, setShowRoleReveal,
    transition, chatMessages, chatInput, setChatInput, error, soundEnabled, setSoundEnabled,
    gameOver, hostRoleInfo, canChat, phaseData, isAlive,
    isPrivate, setIsPrivate, publicRooms
  };

  const actions = {
    createRoom, joinRoom, leaveRoom, startGame, endGame, restartGame, kickPlayer, transferHost,
    sendNightAction, castVote, activateRuqyah, sendChat, showError
  };

  return (
    <>
      {showEliminatedOverlay && eliminatedInfo && (
        <EliminatedOverlay 
          username={eliminatedInfo.username} 
          role={eliminatedInfo.role} 
          onDone={() => setShowEliminatedOverlay(false)} 
        />
      )}
      {showKidnapOverlay && kidnapTarget && (
        <KidnapOverlay 
          username={kidnapTarget} 
          onDone={() => setShowKidnapOverlay(false)} 
        />
      )}

      {countdown !== null && <CountdownOverlay count={countdown} />}
      {transition !== null && (
        <TransitionOverlay
          from={transition.from}
          to={transition.to}
          duration={transition.duration}
        />
      )}

      {screen === 'landing' && <LandingScene state={state} actions={actions} ROLES={ROLES} />}
      {screen === 'create' && <CreateRoomScene state={state} actions={actions} />}
      {screen === 'join' && <JoinRoomScene state={state} actions={actions} />}
      {screen === 'lobby' && <LobbyScene state={state} actions={actions} ROLES={ROLES} socket={socket} />}
      {screen === 'game' && <GameScene state={state} actions={actions} ROLES={ROLES} PHASES={PHASES} chatEndRef={chatEndRef} username={username} />}
      {screen === 'gameover' && <GameOverScene state={state} actions={actions} ROLES={ROLES} />}

      {/* Floating Encyclopedia Button */}
      {screen === 'landing' && (
        <button className="encyclopedia-floating-btn" onClick={() => setShowEncyclopedia(true)} title="Ensiklopedia">
          <span className="icon">📖</span>
          <span className="text">Info</span>
        </button>
      )}

      {/* Encyclopedia Modal */}
      {showEncyclopedia && <EncyclopediaModal onClose={() => setShowEncyclopedia(false)} />}
    </>
  );
}

export default App;
