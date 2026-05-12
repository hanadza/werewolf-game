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
          <h2>Buat Ruangan Baru</h2>
          <p>Siapkan ruangan untuk main bersama</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="form-group">
          <label>Nama Ruangan</label>
          <input
            placeholder="Contoh: Ruangan Seru..."
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            maxLength={30}
          />
        </div>

        <div className="form-group">
          <label>Jumlah Pemain Maksimal</label>
          <div className="slider-container">
            <input
              type="range" min={4} max={20}
              value={maxPlayers}
              onChange={e => setMaxPlayers(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>4</span>
              <span className="slider-value">{maxPlayers} orang</span>
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
                {isPrivate ? 'Hanya bisa masuk via kode' : 'Terlihat di beranda'}
              </span>
            </span>
          </label>
        </div>

        <button className="btn-primary" onClick={createRoom}>
          Buat Ruangan
        </button>
      </div>
    </div>
  );
}
