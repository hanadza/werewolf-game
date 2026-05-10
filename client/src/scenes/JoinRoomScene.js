import React from 'react';

export default function JoinRoomScene({ state, actions }) {
  const { setScreen, error, username, setUsername, joinCode, setJoinCode } = state;
  const { joinRoom } = actions;

  return (
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
}
