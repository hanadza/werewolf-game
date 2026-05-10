import React from 'react';

export default function LandingScene({ state, ROLES }) {
  const { setScreen, soundEnabled, setSoundEnabled } = state;

  return (
    <div className="landing-screen">
      <div className="landing-bg-overlay" />

      <div className="landing-content">
        <div className="landing-hero">
          <div className="landing-logo">👹</div>
          <h1 className="landing-title">Sandekala Village</h1>
          <p className="landing-subtitle">Saha Sanekala di antara urang? saha cing</p>
          <p className="landing-subtitle-id">Siapakah Sanekala di antara kita?</p>
        </div>

        <div className="landing-roles">
          {Object.entries(ROLES).map(([key, r]) => (
            <div key={key} className="landing-role-chip"
              style={{ borderColor: r.color, background: r.bg }}>
              <span>{r.emoji}</span>
              <span style={{ color: r.color }}>{r.name}</span>
            </div>
          ))}
        </div>

        <div className="landing-actions">
          <button className="btn-primary btn-large" onClick={() => setScreen('create')}>
            🏠 Jieun Rohangan
          </button>
          <button className="btn-secondary btn-large" onClick={() => setScreen('join')}>
            🚪 Asup Rohangan
          </button>
        </div>

        <button className="sound-toggle-btn" onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );
}
