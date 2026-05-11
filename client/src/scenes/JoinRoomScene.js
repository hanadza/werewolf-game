import React from 'react';
import SceneTopbar from '../components/SceneTopbar';

export default function JoinRoomScene({ state, actions }) {
  const { setScreen, error, joinCode, setJoinCode } = state;
  const { joinRoom } = actions;

  return (
    <div className="form-screen">
      <SceneTopbar onBack={() => setScreen('landing')} state={state} />

      <div className="form-card">
        <div className="form-header">
          <h2>Asup Rohangan</h2>
          <p>Asup ku kode rohangan private</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="form-group">
          <label>Kode Rohangan</label>
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
          Asup Rohangan
        </button>
      </div>
    </div>
  );
}
