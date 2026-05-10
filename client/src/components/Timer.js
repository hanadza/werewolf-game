import React, { useState, useEffect, useRef } from 'react';
import { PHASES } from '../constants/gameConfig';
import { playSound } from '../utils/soundManager';

export default function Timer({ duration, phase, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const phaseData = PHASES[phase] || PHASES.siang;

  useEffect(() => {
    setTimeLeft(duration);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        if (prev <= 10) playSound('countdown');
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, phase]);

  const percent = (timeLeft / duration) * 100;
  const urgent = timeLeft <= 10;
  const warning = timeLeft <= 20;
  const timerColor = urgent ? '#e94560' : warning ? '#f39c12' : phaseData.color;

  return (
    <div className={`timer-box ${urgent ? 'urgent' : ''}`}>
      <div className="timer-label">
        {urgent ? '⚠️ Waktu Ampir Béak!' : '⏱️ Sesa Waktu'}
      </div>
      <div className="timer-display" style={{ color: timerColor }}>
        <span className="timer-number">
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
          {String(timeLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="timer-bar-bg">
        <div className="timer-bar-fill"
          style={{
            width: `${percent}%`,
            background: timerColor,
            transition: 'width 1s linear, background 0.5s'
          }} />
      </div>
    </div>
  );
}
