import React, { useState, useRef, useEffect } from 'react';
import LandingHero from '../components/landing/LandingHero';
import LandingMenu from '../components/landing/LandingMenu';
import PublicRoomsList from '../components/landing/PublicRoomsList';

export default function LandingScene({ state, actions, ROLES }) {
  const { 
    setScreen, soundEnabled, setSoundEnabled, username, setUsername, 
    publicRooms, error, joinCode, setJoinCode, volume, handleVolumeChange 
  } = state;
  const { joinRoom, showError } = actions;
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef(null);

  // Close volume popup on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target)) {
        setShowVolume(false);
      }
    };
    if (showVolume) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showVolume]);

  const volumeIcon = !soundEnabled || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : volume < 0.7 ? '🔉' : '🔊';

  return (
    <div className="landing-screen-v2">
      <div className="landing-bg-overlay" />

      {/* Top-Right Utility Buttons */}
      <div className="landing-top-utils">
        <button className="landing-util-btn" onClick={() => state.setShowEncyclopedia(true)}>
          <span className="util-icon">📖</span>
          <span className="util-label">Info</span>
        </button>

        <div className="volume-control-wrap" ref={volumeRef}>
          <button 
            className={`landing-util-btn ${showVolume ? 'active' : ''}`} 
            onClick={() => setShowVolume(!showVolume)}
          >
            {volumeIcon}
          </button>

          {showVolume && (
            <div className="volume-popup">
              <div className="volume-popup-header">
                <span className="volume-popup-label">Volume</span>
                <span className="volume-popup-value">{Math.round((soundEnabled ? volume : 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={soundEnabled ? Math.round(volume * 100) : 0}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  handleVolumeChange(val);
                  if (val > 0 && !soundEnabled) setSoundEnabled(true);
                }}
                className="volume-slider"
              />
              <button 
                className="volume-mute-btn"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (soundEnabled) handleVolumeChange(0);
                  else handleVolumeChange(0.4);
                }}
              >
                {soundEnabled ? '🔇 Mute' : '🔊 Unmute'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="landing-layout">
        {/* Hero - Top */}
        <LandingHero />

        {error && <div className="error-box landing-error">{error}</div>}

        {/* Main Content - 2 Column on Desktop */}
        <div className="landing-columns">
          {/* Left Column - Menu */}
          <div className="landing-col-left">
            <LandingMenu
              username={username}
              setUsername={setUsername}
              setScreen={setScreen}
              joinRoom={joinRoom}
              showError={showError}
              joinCode={joinCode}
              setJoinCode={setJoinCode}
            />
          </div>

          {/* Right Column - Rooms */}
          <div className="landing-col-right">
            <PublicRoomsList
              publicRooms={publicRooms}
              username={username}
              joinRoom={joinRoom}
              showError={showError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

