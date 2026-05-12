import React from 'react';

export default function LandingMenu({ username, setUsername, setScreen, joinRoom, showError, joinCode, setJoinCode }) {
  const [showJoinInput, setShowJoinInput] = React.useState(false);

  const handleCreateRoom = () => {
    if (!username.trim()) return showError('Isi nama dulu!');
    setScreen('create');
  };

  const handleJoinPrivate = () => {
    if (!username.trim()) return showError('Isi nama dulu!');
    if (!showJoinInput) {
      setShowJoinInput(true);
      return;
    }
    if (!joinCode.trim()) return showError('Isi kode ruangan dulu!');
    joinRoom(joinCode);
  };

  return (
    <div className="landing-menu">
      <div className="menu-field">
        <label className="menu-label">Nama Pemain</label>
        <input
          className="menu-input"
          placeholder="Masukkan nama kamu..."
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className="menu-actions">
        <button className="menu-btn menu-btn-primary" onClick={handleCreateRoom}>
          Buat Ruangan
        </button>

        <div className="menu-join-section">
          <button
            className={`menu-btn menu-btn-secondary ${showJoinInput ? 'active' : ''}`}
            onClick={handleJoinPrivate}
          >
            {showJoinInput ? 'Masuk' : 'Masuk via Kode Private'}
          </button>
          {showJoinInput && (
            <div className="menu-join-input-wrap">
              <input
                className="menu-code-input"
                placeholder="ABC123"
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
