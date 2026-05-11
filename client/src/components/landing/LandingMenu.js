import React, { useState } from 'react';

export default function LandingMenu({ username, setUsername, setScreen, joinRoom, showError, joinCode, setJoinCode }) {
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreateRoom = () => {
    if (!username.trim()) return showError('Eusi ngaran heula!');
    setScreen('create');
  };

  const handleJoinPrivate = () => {
    if (!username.trim()) return showError('Eusi ngaran heula!');
    if (!showJoinInput) {
      setShowJoinInput(true);
      return;
    }
    if (!joinCode.trim()) return showError('Eusi kode rohangan heula!');
    joinRoom(joinCode);
  };

  return (
    <div className="landing-menu">
      {/* Username Input */}
      <div className="menu-field">
        <label className="menu-label">👤 Ngaran Pamaén</label>
        <input
          className="menu-input"
          placeholder="Lebetkeun ngaran maneh..."
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={20}
        />
      </div>

      {/* Action Buttons */}
      <div className="menu-actions">
        <button className="menu-btn menu-btn-primary" onClick={handleCreateRoom}>
          <span className="menu-btn-icon">🏠</span>
          <span>Jieun Rohangan</span>
        </button>

        <div className="menu-join-section">
          <button 
            className={`menu-btn menu-btn-secondary ${showJoinInput ? 'active' : ''}`} 
            onClick={handleJoinPrivate}
          >
            <span className="menu-btn-icon">🔑</span>
            <span>{showJoinInput ? 'Asup' : 'Asup (Kode Private)'}</span>
          </button>
          {showJoinInput && (
            <div className="menu-join-input-wrap">
              <input
                className="menu-code-input"
                placeholder="Kode: ABC123"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleJoinPrivate();
                  if (e.key === 'Escape') setShowJoinInput(false);
                }}
                autoFocus
              />
              <button className="menu-join-cancel" onClick={() => setShowJoinInput(false)}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
