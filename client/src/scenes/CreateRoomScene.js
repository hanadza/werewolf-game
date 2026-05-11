import React from 'react';
import { getRolePreview } from '../utils/helpers';
import SceneTopbar from '../components/SceneTopbar';

export default function CreateRoomScene({ state, actions }) {
  const { setScreen, error, roomName, setRoomName, maxPlayers, setMaxPlayers, isPrivate, setIsPrivate } = state;
  const { createRoom } = actions;

  return (
    <div className="form-screen">
      <SceneTopbar onBack={() => setScreen('landing')} state={state} />

      <div className="form-card">
        <div className="form-header">
          <h2>Jieun Rohangan Anyar</h2>
          <p>Siapkeun rohangan pikeun maén bareng</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="form-group">
          <label>Ngaran Rohangan</label>
          <input
            placeholder="Contoh: Rohangan Seru..."
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            maxLength={30}
          />
        </div>

        <div className="form-group">
          <label>Jumlah Pamain Maksimal</label>
          <div className="slider-container">
            <input
              type="range" min={4} max={20}
              value={maxPlayers}
              onChange={e => setMaxPlayers(Number(e.target.value))}
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

        <div className="form-group">
          <label className="toggle-label toggle-modern">
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
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

        <button className="btn-primary" onClick={createRoom}>
          Jieun Rohangan
        </button>
      </div>
    </div>
  );
}
