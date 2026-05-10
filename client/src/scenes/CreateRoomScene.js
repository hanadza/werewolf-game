import React from 'react';
import { getRolePreview } from '../utils/helpers';

export default function CreateRoomScene({ state, actions }) {
  const { setScreen, error, username, setUsername, roomName, setRoomName, maxPlayers, setMaxPlayers, isPrivate, setIsPrivate } = state;
  const { createRoom } = actions;

  return (
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
              type="range" min={3} max={20}
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

        <div className="form-group row-group">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={e => setIsPrivate(e.target.checked)} 
            />
            <span className="toggle-text">🔒 Jieun Rohangan Private (Teu katingali di Landing Page)</span>
          </label>
        </div>

        <button className="btn-primary" onClick={createRoom}>
          🏠 Jieun Rohangan
        </button>
      </div>
    </div>
  );
}
