import React from 'react';
import { ROLES, PHASES } from '../constants/gameConfig';

export default function HostMonitor({ players, hostRoleInfo, phase, dayCount }) {
  return (
    <div className="host-monitor">
      <div className="host-monitor-title">👑 Monitor Host</div>
      <div className="host-monitor-phase">
        {PHASES[phase]?.emoji} {PHASES[phase]?.label || phase} - Ronde {dayCount}
      </div>
      <div className="host-player-list">
        {hostRoleInfo.map((p, i) => {
          const roleData = ROLES[p.role];
          const playerStatus = players.find(pl => pl.username === p.username);
          return (
            <div key={i} className={`host-player-item ${!playerStatus?.isAlive ? 'dead' : ''}`}>
              <span className="host-player-role">{roleData?.emoji}</span>
              <span className="host-player-name">{p.username}</span>
              <span className="host-player-role-name"
                style={{ color: roleData?.color }}>
                {roleData?.name}
              </span>
              <span className={`host-player-status ${!playerStatus?.isAlive ? 'dead' : 'alive'}`}>
                {playerStatus?.isAlive ? '●' : '✕'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
