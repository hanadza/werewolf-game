import React from 'react';

export default function LandingScene({ state, actions, ROLES }) {
  const { setScreen, soundEnabled, setSoundEnabled, username, setUsername, publicRooms, error } = state;
  const { joinRoom } = actions;

  return (
    <div className="landing-screen">
      <div className="landing-bg-overlay" />

      <div className="landing-content">
        <div className="landing-hero">
          <div className="landing-logo">👹</div>
          <h1 className="landing-title">Sandekala Village</h1>
          <p className="landing-subtitle">Saha Sanekala di antara urang?</p>
        </div>

        {error && <div className="error-box" style={{marginBottom: '20px'}}>{error}</div>}

        <div className="landing-form-group">
          <input
            className="landing-username-input"
            placeholder="👤 Lebetkeun ngaran maneh..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="landing-actions">
          <button className="btn-primary btn-large" onClick={() => {
            if (!username.trim()) return actions.showError('Eusi ngaran heula!');
            setScreen('create');
          }}>
            🏠 Jieun Rohangan
          </button>
          <button className="btn-secondary btn-large" onClick={() => {
            if (!username.trim()) return actions.showError('Eusi ngaran heula!');
            setScreen('join');
          }}>
            🚪 Asup Rohangan (Kode)
          </button>
        </div>

        <div className="public-rooms-container">
          <h3 className="public-rooms-title">🌍 Rohangan Public</h3>
          {publicRooms.length > 0 ? (
            <div className="public-rooms-list">
              {publicRooms.map((room) => {
                const isFull = room.playersCount >= room.maxPlayers;
                const isPlaying = room.phase !== 'lobby';
                const canJoin = !isFull && !isPlaying;

                return (
                  <div key={room.code} className={`public-room-item ${!canJoin ? 'disabled' : ''}`} onClick={() => {
                    if (!canJoin) return;
                    if (!username.trim()) return actions.showError('Eusi ngaran heula!');
                    joinRoom(room.code);
                  }}>
                    <div className="room-info">
                      <span className="room-name">{room.name}</span>
                      <span className="room-players">👥 {room.playersCount}/{room.maxPlayers}</span>
                    </div>
                    {isPlaying ? (
                      <span className="room-status-badge" style={{fontSize:'0.75rem', opacity: 0.7, fontStyle: 'italic', color: '#f39c12'}}>Sedang Main</span>
                    ) : isFull ? (
                      <span className="room-status-badge" style={{fontSize:'0.75rem', opacity: 0.7, fontStyle: 'italic', color: '#e94560'}}>Penuh</span>
                    ) : (
                      <button className="btn-join-small">Asup</button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-rooms-text">Teu aya rohangan public anu sayogi.</p>
          )}
        </div>

        <button className="sound-toggle-btn" onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );
}
