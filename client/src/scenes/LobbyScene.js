import React from 'react';
import { getRolePreview } from '../utils/helpers';

export default function LobbyScene({ state, actions, ROLES, socket }) {
  const { currentRoomName, isHost, currentRoom, error, maxPlayers, setMaxPlayers, players, username, isPrivate, setIsPrivate } = state;
  const { kickPlayer, startGame, transferHost } = actions;

  return (
    <div className="lobby-screen">
      <div className="lobby-card">
        {/* Header */}
        <div className="lobby-header">
          <div className="lobby-title">
            <span className="lobby-icon">⚖️</span>
            <div>
              <h1>{currentRoomName}</h1>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                <span className={`visibility-badge ${isPrivate ? 'private' : 'public'}`}>
                  {isPrivate ? '🔒 Private' : '🌍 Public'}
                </span>
              </div>
            </div>
          </div>
          {isHost && <span className="host-badge">👑 Host</span>}
        </div>

        {/* Room Code */}
        <div className="room-code-section">
          <p className="room-code-label">Kode Rohangan</p>
          <div className="room-code-display">{currentRoom}</div>
          <p className="room-code-hint">Bagikeun kode ieu ka babaturan</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Host Controls */}
        {isHost && (
          <div className="host-controls">
            <div className="host-controls-title">⚙️ Setelan Host</div>
            
            <div className="form-group" style={{marginBottom: '12px'}}>
              <label>👥 Maksimal Pamain</label>
              <div className="slider-container">
                <input
                  type="range" min={4} max={20}
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
                  <span>4</span>
                  <span className="slider-value">{maxPlayers} urang</span>
                  <span>20</span>
                </div>
              </div>
              <div className="role-preview-info">
                {getRolePreview(maxPlayers)}
              </div>
            </div>

            <label className="toggle-label toggle-modern">
              <div className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={isPrivate} 
                  onChange={e => {
                    const newStatus = e.target.checked;
                    setIsPrivate(newStatus);
                    socket.emit('toggleRoomVisibility', {
                      roomCode: currentRoom,
                      isPrivate: newStatus
                    });
                  }} 
                />
                <span className="toggle-track"></span>
              </div>
              <span className="toggle-text">
                {isPrivate ? '🔒 Private' : '🌍 Public'}
                <span className="toggle-hint">
                  {isPrivate ? 'Ngan bisa asup ku kode' : 'Katingali di landing page'}
                </span>
              </span>
            </label>
          </div>
        )}

        {/* Players */}
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
                  {p.isHost && (
                    <span className="host-badge" style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.7rem', flexShrink: 0 }}>👑</span>
                  )}
                </span>
                {isHost && p.username !== username && (
                  <div style={{display: 'flex', gap: '6px'}}>
                    <button className="kick-btn" style={{borderColor: '#f39c12', color: '#f39c12', background: 'rgba(243, 156, 18, 0.2)'}} onClick={() => transferHost(p.username)} title="Transfer Host">👑</button>
                    <button className="kick-btn" onClick={() => kickPlayer(p.username)} title="Kick">✕</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Role Info - Compact */}
        <div className="role-info-section">
          <h3>📋 Peran anu bakal aya:</h3>
          <div className="role-chips">
            {Object.entries(ROLES).map(([key, r]) => (
              <div key={key} className="role-chip" style={{ borderColor: r.color, background: r.bg }}>
                {r.emoji} <span style={{ color: r.color }}>{r.name}</span>
              </div>
            ))}
          </div>
          <div className="role-requirements">
            <div className="role-req-grid">
              <span>🎮 Min 4 pamain</span>
              <span>🔮 Dukun: 4+</span>
              <span>👴 Kolot: 6+</span>
              <span>🗝️ Kuncen: 7+</span>
              <span>🕌 Ajengan: 8+</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="lobby-actions">
          {isHost ? (
            <button className="btn-primary btn-start" onClick={startGame} disabled={players.length < 4}>
              {players.length < 4 ? `Kurang ${4 - players.length} pamain deui` : '🎮 Mimitian Kaulinan!'}
            </button>
          ) : (
            <div className="waiting-host">⏳ Ngantosan host mimitian kaulinan...</div>
          )}
          <button className="btn-danger" onClick={actions.leaveRoom} style={{marginTop: '8px'}}>
            ← Kaluar Rohangan
          </button>
        </div>
      </div>
    </div>
  );
}
