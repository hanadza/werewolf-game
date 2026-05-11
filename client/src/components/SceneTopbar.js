import React, { useState, useRef, useEffect } from 'react';

export default function SceneTopbar({ onBack, backLabel = '← Balik', state }) {
  const { soundEnabled, setSoundEnabled, volume, handleVolumeChange, setShowEncyclopedia } = state;
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef(null);

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
    <div className="scene-topbar">
      <button className="topbar-btn" onClick={onBack}>
        {backLabel}
      </button>

      <div className="scene-topbar-right">
        <button className="topbar-btn" onClick={() => setShowEncyclopedia(true)}>
          Info
        </button>

        <div className="volume-control-wrap" ref={volumeRef}>
          <button
            className={`topbar-btn ${showVolume ? 'active' : ''}`}
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
                {soundEnabled ? 'Mute' : 'Unmute'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
