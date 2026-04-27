import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');

function App() {
  const [screen, setScreen] = useState('home');
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [players, setPlayers] = useState([]);
  const [myRole, setMyRole] = useState('');
  const [teammates, setTeammates] = useState([]);
  const [phase, setPhase] = useState('');
  const [dayCount, setDayCount] = useState(1);
  const [phaseMessage, setPhaseMessage] = useState('');
  const [error, setError] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [nightTargets, setNightTargets] = useState([]);
  const [nightInstruction, setNightInstruction] = useState('');
  const [voteTargets, setVoteTargets] = useState([]);
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState('');
  const [actionConfirmed, setActionConfirmed] = useState('');
  const [nightResult, setNightResult] = useState(null);
  const [seerResult, setSeerResult] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [eliminatedInfo, setEliminatedInfo] = useState(null);
  const chatEndRef = useRef(null);
  const usernameRef = useRef('');

  useEffect(() => { usernameRef.current = username; }, [username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    socket.on('roomCreated', ({ roomCode }) => {
      setCurrentRoom(roomCode);
      socket.emit('joinRoom', { roomCode, username: usernameRef.current });
    });

    socket.on('roomJoined', ({ roomCode }) => {
      setCurrentRoom(roomCode);
      setScreen('lobby');
    });

    socket.on('playerList', setPlayers);

    socket.on('gameStarted', ({ players, phase, dayCount }) => {
      setPlayers(players);
      setPhase(phase);
      setDayCount(dayCount || 1);
      setScreen('game');
    });

    socket.on('yourRole', ({ role, teammates }) => {
      setMyRole(role);
      setTeammates(teammates || []);
    });

    socket.on('phaseChange', ({ phase, dayCount, message }) => {
      setPhase(phase);
      setDayCount(dayCount || 1);
      setPhaseMessage(message);
      setMyVote('');
      setVotes({});
      setNightTargets([]);
      setNightInstruction('');
      setActionConfirmed('');
      setSeerResult(null);
      setNightResult(null);
      setEliminatedInfo(null);
    });

    socket.on('nightInstruction', ({ message, targets }) => {
      setNightInstruction(message);
      setNightTargets(targets);
    });

    socket.on('actionConfirmed', ({ message }) => {
      setActionConfirmed(message);
      setNightTargets([]);
    });

    socket.on('seerResult', ({ target, role, isWerewolf }) => {
      setSeerResult({ target, role, isWerewolf });
    });

    socket.on('nightResult', ({ killed, protected: prot, players }) => {
      setPlayers(players);
      setNightResult({ killed, protected: prot });
    });

    socket.on('startVoting', ({ targets }) => {
      setVoteTargets(targets.filter(t => t !== usernameRef.current));
    });

    socket.on('voteUpdate', ({ votes }) => {
      setVotes(votes);
    });

    socket.on('playerEliminated', ({ username, role, players }) => {
      setPlayers(players);
      setEliminatedInfo({ username, role });
    });

    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('gameOver', (data) => {
      setGameOver(data);
      setScreen('gameover');
    });

    socket.on('gameError', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 4000);
    });

    return () => {
      ['roomCreated','roomJoined','playerList','gameStarted','yourRole',
       'phaseChange','nightInstruction','actionConfirmed','seerResult',
       'nightResult','startVoting','voteUpdate','playerEliminated',
       'chatMessage','gameOver','gameError'].forEach(e => socket.off(e));
    };
  }, []);

  const createRoom = () => {
    if (!username || !roomName) return setError('Fill username & room name!');
    socket.emit('createRoom', { roomName, maxPlayers: 12 });
  };

  const joinRoom = () => {
    if (!username || !roomCode) return setError('Fill username & room code!');
    socket.emit('joinRoom', { roomCode: roomCode.toUpperCase(), username });
  };

  const startGame = () => socket.emit('startGame', currentRoom);

  const sendNightAction = (target) => {
    socket.emit('nightAction', { roomCode: currentRoom, targetUsername: target });
  };

  const castVote = (target) => {
    if (myVote) return;
    setMyVote(target);
    socket.emit('castVote', { roomCode: currentRoom, targetUsername: target });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('sendChat', { roomCode: currentRoom, message: chatInput });
    setChatInput('');
  };

  const getRoleEmoji = (role) => ({
    werewolf: '🐺', seer: '🔮', doctor: '⚕️', villager: '👨‍🌾'
  })[role] || '❓';

  const getRoleColor = (role) => ({
    werewolf: '#e94560', seer: '#9b59b6', doctor: '#2ecc71', villager: '#f39c12'
  })[role] || '#fff';

  const isAlive = players.find(p => p.username === username)?.isAlive ?? true;
  const canChat = (phase === 'day' && isAlive) ||
    (phase === 'night' && myRole === 'werewolf' && isAlive);

  if (screen === 'home') return (
    <div className="container">
      <div className="card">
        <h1>🐺 Werewolf</h1>
        {error && <div className="error">{error}</div>}
        <div className="section">
          <label>Username</label>
          <input placeholder="Enter username"
            value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <hr />
        <div className="section">
          <h3>🏠 Create Room</h3>
          <input placeholder="Room Name"
            value={roomName} onChange={e => setRoomName(e.target.value)} />
          <button onClick={createRoom}>Create Room</button>
        </div>
        <hr />
        <div className="section">
          <h3>🚪 Join Room</h3>
          <input placeholder="Room Code (e.g. ABC123)"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())} />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    </div>
  );

  if (screen === 'lobby') return (
    <div className="container">
      <div className="card">
        <h1>🏠 Lobby</h1>
        <div className="room-code-box">
          <p>Share this code:</p>
          <div className="code">{currentRoom}</div>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="players-section">
          <h3>👥 Players ({players.length}/12)</h3>
          <ul className="players">
            {players.map((p, i) => (
              <li key={i}>
                <span>👤 {p.username}</span>
                {p.isHost && <span className="badge">Host</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="role-info">
          <h3>📋 Roles in this game:</h3>
          <div className="role-tags">
            <span className="tag werewolf">🐺 Werewolf</span>
            <span className="tag seer">🔮 Seer</span>
            <span className="tag doctor">⚕️ Doctor</span>
            <span className="tag villager">👨‍🌾 Villager</span>
          </div>
        </div>
        <button onClick={startGame} disabled={players.length < 3} className="start-btn">
          {players.length < 3 ? `Need ${3 - players.length} more` : '🎮 Start Game!'}
        </button>
      </div>
    </div>
  );

  if (screen === 'game') return (
    <div className="game-layout">
      <div className="left-panel">
        {myRole && (
          <div className="panel-card role-box" style={{ borderColor: getRoleColor(myRole) }}>
            <p className="label">YOUR ROLE</p>
            <div className="role" style={{ color: getRoleColor(myRole) }}>
              {getRoleEmoji(myRole)} {myRole.toUpperCase()}
            </div>
            <div className="role-desc">
              {myRole === 'werewolf' && '🐺 Kill a villager each night!'}
              {myRole === 'seer' && '🔮 Reveal one player each night!'}
              {myRole === 'doctor' && '⚕️ Protect one player each night!'}
              {myRole === 'villager' && '👨‍🌾 Vote out the werewolves!'}
            </div>
            {teammates.length > 0 && (
              <div className="teammates">
                🐺 Teammates: {teammates.join(', ')}
              </div>
            )}
          </div>
        )}

        <div className="panel-card phase-box">
          <div className="phase-header">
            {phase === 'night' ? '🌙 NIGHT' : '☀️ DAY'} {dayCount}
          </div>
          {phaseMessage && <p className="phase-msg">{phaseMessage}</p>}
        </div>

        {phase === 'night' && nightTargets.length > 0 && isAlive && (
          <div className="panel-card action-box">
            <p className="label">NIGHT ACTION</p>
            <p className="action-msg">{nightInstruction}</p>
            <div className="target-list">
              {nightTargets.map((t, i) => (
                <button key={i} className="target-btn" onClick={() => sendNightAction(t)}>
                  👤 {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {actionConfirmed && (
          <div className="panel-card confirmed-box">✅ {actionConfirmed}</div>
        )}

        {seerResult && (
          <div className="panel-card seer-box">
            <p className="label">🔮 SEER VISION</p>
            <p>{seerResult.target} is a{' '}
              <strong style={{ color: getRoleColor(seerResult.role) }}>
                {getRoleEmoji(seerResult.role)} {seerResult.role.toUpperCase()}
              </strong>!
            </p>
          </div>
        )}

        {nightResult && (
          <div className="panel-card night-result-box">
            <p className="label">🌅 NIGHT RESULT</p>
            {nightResult.killed
              ? <p>😱 <strong>{nightResult.killed}</strong> was killed!</p>
              : <p>🎉 Everyone survived!</p>}
            {nightResult.protected && (
              <p>🛡️ <strong>{nightResult.protected}</strong> was protected!</p>
            )}
          </div>
        )}

        {eliminatedInfo && (
          <div className="panel-card eliminated-box">
            <p className="label">⚖️ ELIMINATED</p>
            <p>🪓 <strong>{eliminatedInfo.username}</strong> was a{' '}
              <strong style={{ color: getRoleColor(eliminatedInfo.role) }}>
                {getRoleEmoji(eliminatedInfo.role)} {eliminatedInfo.role}
              </strong>!
            </p>
          </div>
        )}

        {phase === 'day' && voteTargets.length > 0 && isAlive && !myVote && (
          <div className="panel-card vote-box">
            <p className="label">🗳️ CAST YOUR VOTE</p>
            <p>Who is the werewolf?</p>
            <div className="target-list">
              {voteTargets.map((t, i) => (
                <button key={i} className="vote-btn" onClick={() => castVote(t)}>
                  🪓 Eliminate {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {myVote && phase === 'day' && (
          <div className="panel-card confirmed-box">
            ✅ You voted to eliminate: <strong>{myVote}</strong>
          </div>
        )}

        {phase === 'day' && Object.keys(votes).length > 0 && (
          <div className="panel-card vote-tracker">
            <p className="label">📊 VOTE TRACKER</p>
            {Object.entries(votes).map(([voter, target], i) => (
              <div key={i} className="vote-row">
                <span>👤 {voter}</span>
                <span>→ 🪓 {target}</span>
              </div>
            ))}
          </div>
        )}

        {!isAlive && (
          <div className="panel-card dead-box">
            💀 You are dead! You can only watch.
          </div>
        )}
      </div>

      <div className="right-panel">
        <div className="panel-card">
          <h3>👥 Players ({players.filter(p => p.isAlive).length} alive)</h3>
          <ul className="players">
            {players.map((p, i) => (
              <li key={i} className={!p.isAlive ? 'dead' : ''}>
                <span>{p.isAlive ? '👤' : '💀'} {p.username}
                  {p.username === username && ' (You)'}
                </span>
                {!p.isAlive && <span className="badge dead-badge">Dead</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel-card chat-panel">
          <h3>
            💬 Chat
            {phase === 'night' && myRole === 'werewolf' && ' (Werewolf only)'}
            {phase === 'night' && myRole !== 'werewolf' && ' (Night - silent)'}
          </h3>
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.type}`}>
                {msg.type !== 'system' && (
                  <span className="chat-user">{msg.username}</span>
                )}
                <span className="chat-text">{msg.message}</span>
                <span className="chat-time">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {canChat && (
            <div className="chat-input">
              <input
                placeholder="Type message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
              />
              <button onClick={sendChat}>Send</button>
            </div>
          )}
          {!canChat && (
            <div className="chat-disabled">
              🔇 {phase === 'night' ? 'Silent during night' : 'Dead players cannot chat'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (screen === 'gameover') return (
    <div className="container">
      <div className="card">
        <h1>{gameOver?.winner === 'villagers' ? '🏆 Villagers Win!' : '🐺 Werewolves Win!'}</h1>
        <div className={`winner-banner ${gameOver?.winner}`}>
          {gameOver?.message}
        </div>
        <h3>📋 Role Reveal:</h3>
        <ul className="players role-reveal">
          {gameOver?.roleReveal?.map((p, i) => (
            <li key={i} className={!p.isAlive ? 'dead' : ''}>
              <span>{p.isAlive ? '👤' : '💀'} {p.username}</span>
              <span style={{ color: getRoleColor(p.role) }}>
                {getRoleEmoji(p.role)} {p.role}
              </span>
            </li>
          ))}
        </ul>
        <button onClick={() => window.location.reload()}>🔄 Play Again</button>
      </div>
    </div>
  );

  return null;
}

export default App;
