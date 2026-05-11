import React, { useEffect, useState } from 'react';
import { ROLES } from '../constants/gameConfig';

export default function EliminatedOverlay({ username, role, onDone }) {
  const [show, setShow] = useState(false);
  const roleData = ROLES[role];

  useEffect(() => {
    // Slight delay to trigger CSS transition
    const timer1 = setTimeout(() => setShow(true), 100);
    // Unmount after 5s
    const timer2 = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 600); // Wait for fade out
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onDone]);

  return (
    <div className={`fullscreen-overlay role-reveal-overlay eliminated-overlay ${show ? 'show' : ''}`}>
      <div className={`role-reveal-card eliminated-card-content ${show ? 'show' : ''}`}>
        <div className="role-reveal-pretitle" style={{ color: '#e94560' }}>KAPUTUSAN SIDANG</div>
        <div className="role-reveal-emoji eliminated-emoji">🪓</div>
        <div className="role-reveal-name eliminated-name">{username}</div>
        <div className="role-reveal-desc" style={{ marginTop: '20px' }}>
          Geus diusir tina lembur! Manéhna téh:
        </div>
        <div className="eliminated-role-reveal" style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: roleData?.bg, 
          border: `1px solid ${roleData?.color}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>{roleData?.emoji}</span>
          <strong style={{ color: roleData?.color, fontSize: '1.2rem' }}>{roleData?.name}</strong>
        </div>
      </div>
    </div>
  );
}
