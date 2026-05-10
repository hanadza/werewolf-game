import React, { useState, useEffect } from 'react';
import { ROLES } from '../constants/gameConfig';

export default function RoleRevealOverlay({ role, teammates, onDone }) {
  const [visible, setVisible] = useState(false);
  const roleData = ROLES[role];

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const timer = setTimeout(() => onDone(), 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fullscreen-overlay role-reveal-overlay">
      <div className={`role-reveal-card ${visible ? 'show' : ''}`}
        style={{ borderColor: roleData?.color, background: roleData?.bg }}>
        <div className="role-reveal-pretitle">Peran maneh nyaéta...</div>
        <div className="role-reveal-emoji">{roleData?.emoji}</div>
        <div className="role-reveal-name" style={{ color: roleData?.color }}>
          {roleData?.name}
        </div>
        <div className="role-reveal-desc">{roleData?.desc}</div>
        {teammates?.length > 0 && (
          <div className="role-reveal-teammates">
            👹 Batur Sanekala: {teammates.join(', ')}
          </div>
        )}
        <div className="role-reveal-timer">Nutup otomatis...</div>
      </div>
    </div>
  );
}
