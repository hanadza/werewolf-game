import React from 'react';
import { getRolePreview } from '../utils/helpers';
import SceneTopbar from '../components/SceneTopbar';

export default function LobbyScene({ state, actions, ROLES, socket }) {
  const { currentRoomName, isHost, currentRoom, error, maxPlayers, setMaxPlayers, players, username, isPrivate, setIsPrivate } = state;
  const { kickPlayer, startGame, transferHost } = actions;

  return (
    <div className="lobby-screen-v2">
      <SceneTopbar onBack={actions.leaveRoom} backLabel="← Kaluar" state={state} />

      {/* Header */}
      <div className="lobby-v2-header">
        <h1 className="lobby-v2-title">{currentRoomName}</h1>
        <span className={`visibility-badge ${isPrivate ? 'private' : 'public'}`}>
          {isPrivate ? 'Private' : 'Public'}
        </span>
        {isHost && <span className="host-badge" style={{padding: '4px 10px', fontSize: '0.75rem'}}>Host</span>}
      </div>

      {error && <div className="error-box" style={{maxWidth: '960px', margin: '0 auto 12px'}}>{error}</div>}

      {/* 2-Column Layout */}
      <div className="lobby-v2-columns">
        {/* Left: Players */}
        <div className="lobby-v2-left">
          <div className="lobby-panel">
            <div className="lobby-panel-header">
              <h3>Urang Lembur</h3>
              <span className="lobby-panel-count">
                {isHost ? `${players.length}/${maxPlayers}` : `${players.length} urang`}
              </span>
            </div>
            <ul className="lobby-players-list">
              {players.map((p, i) => (
                <li key={i} className="lobby-player-item">
                  <div className="lobby-player-info">
                    <span className="lobby-player-avatar">👤</span>
                    <span className="lobby-player-name">{p.username}</span>
                    {p.username === username && <span className="you-badge">Maneh</span>}
                    {p.isHost && <span className="lobby-host-tag">👑</span>}
                  </div>
                  {isHost && p.username !== username && (
                    <div className="lobby-player-actions">
                      <button className="lobby-action-btn transfer" onClick={() => transferHost(p.username)} title="Transfer Host">👑</button>
                      <button className="lobby-action-btn kick" onClick={() => kickPlayer(p.username)} title="Kick">✕</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {players.length === 0 && (
              <div className="lobby-empty-players">Teu aya pamain acan...</div>
            )}
          </div>
        </div>

        {/* Right: Settings + Roles + Actions */}
        <div className="lobby-v2-right">
          {/* Room Code */}
          <div className="lobby-panel lobby-code-panel">
            <p className="lobby-code-label">Kode Rohangan</p>
            <div className="lobby-code-display">{currentRoom}</div>
            <p className="lobby-code-hint">Bagikeun ka babaturan maneh</p>
          </div>

          {/* Host Controls + Role Info (merged) */}
          {isHost ? (
            <div className="lobby-panel lobby-settings-panel">
              <div className="lobby-panel-header">
                <h3>Setelan</h3>
              </div>

              {/* Max Players slider */}
              <div className="form-group" style={{marginBottom: '12px'}}>
                <label>Maksimal Pamain</label>
                <div className="slider-container">
                  <input
                    type="range" min={4} max={20}
                    value={maxPlayers}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setMaxPlayers(val);
                      socket.emit('updateMaxPlayers', { roomCode: currentRoom, maxPlayers: val });
                    }}
                    className="slider"
                  />
                  <div className="slider-labels">
                    <span>4</span>
                    <span className="slider-value">{maxPlayers} urang</span>
                    <span>20</span>
                  </div>
                </div>
              </div>

              {/* Role preview (host only, with counts) */}
              <div className="role-preview-info" style={{marginBottom: '12px'}}>
                {getRolePreview(maxPlayers)}
              </div>

              {/* Prerequisites — host only */}
              <div className="role-req-grid" style={{marginBottom: '14px'}}>
                <span>Min 4 pamain</span>
                <span>Dukun: 4+</span>
                <span>Kolot: 6+</span>
                <span>Kuncen: 7+</span>
                <span>Ajengan: 8+</span>
              </div>

              {/* Private/Public toggle */}
              <label className="toggle-label toggle-modern">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => {
                      const newStatus = e.target.checked;
                      setIsPrivate(newStatus);
                      socket.emit('toggleRoomVisibility', { roomCode: currentRoom, isPrivate: newStatus });
                    }}
                  />
                  <span className="toggle-track"></span>
                </div>
                <span className="toggle-text">
                  {isPrivate ? 'Private' : 'Public'}
                  <span className="toggle-hint">
                    {isPrivate ? 'Ngan bisa asup ku kode' : 'Katingali di landing page'}
                  </span>
                </span>
              </label>
            </div>
          ) : (
            /* Non-host: just show role chips, no prereqs, no settings */
            <div className="lobby-panel">
              <div className="lobby-panel-header">
                <h3>Daftar Peran</h3>
              </div>
              <div className="role-chips">
                {Object.entries(ROLES).map(([key, r]) => (
                  <div key={key} className="role-chip" style={{ borderColor: r.color, background: r.bg }}>
                    {r.emoji} <span style={{ color: r.color }}>{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start */}
          <div className="lobby-start-section">
            {isHost ? (
              <button className="btn-primary btn-start" onClick={startGame} disabled={players.length < 4}>
                {players.length < 4 ? `Kurang ${4 - players.length} pamain deui` : 'Mimitian Kaulinan!'}
              </button>
            ) : (
              <div className="waiting-host">Ngantosan host mimitian...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
