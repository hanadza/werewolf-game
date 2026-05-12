import React, { useEffect, useState } from 'react';

export default function KidnapOverlay({ username, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShow(true), 100);
    const timer2 = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 600);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onDone]);

  return (
    <div className={`fullscreen-overlay role-reveal-overlay kidnap-overlay ${show ? 'show' : ''}`}>
      <div className={`role-reveal-card kidnap-card-content ${show ? 'show' : ''}`}>
        <div className="role-reveal-pretitle" style={{ color: '#e94560' }}>KORBAN SANEKALA</div>
        <div className="role-reveal-emoji kidnap-emoji">😱</div>
        <div className="role-reveal-name kidnap-name">{username}</div>
        <div className="role-reveal-desc" style={{ marginTop: '20px' }}>
          Diculik oleh Sanekala malam ini! Hilang dari rumahnya...
        </div>
      </div>
    </div>
  );
}
