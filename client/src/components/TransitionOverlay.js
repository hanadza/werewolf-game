import React, { useState, useEffect } from 'react';
import { PHASES } from '../constants/gameConfig';

export default function TransitionOverlay({ from, to, duration }) {
  const [progress, setProgress] = useState(0);
  const phaseData = PHASES[to] || PHASES.siang;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + (100 / (duration * 10)), 100));
    }, 100);
    return () => clearInterval(interval);
  }, [duration]);

  const messages = {
    siang: '☀️ Matahari terbit... Warga berkumpul untuk bersidang!',
    senja: '🌅 Senja tiba... Sanekala mulai berkeliaran!',
    malam: '🌙 Malam menutupi desa... Apa yang terjadi?'
  };

  return (
    <div className="fullscreen-overlay transition-overlay"
      style={{ 
        background: phaseData.bg,
        animationDuration: `${duration}s`
      }}>
      <div className="transition-content">
        <div className="transition-emoji">{phaseData.emoji}</div>
        <div className="transition-label" style={{ color: phaseData.color }}>
          {phaseData.label}
        </div>
        <div className="transition-message">{messages[to]}</div>
        <div className="transition-bar-bg">
          <div className="transition-bar-fill"
            style={{ width: `${progress}%`, background: phaseData.color }} />
        </div>
      </div>
    </div>
  );
}
