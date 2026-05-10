import React from 'react';

export default function CountdownOverlay({ count }) {
  return (
    <div className="fullscreen-overlay countdown-overlay">
      <div className="countdown-content">
        <div className="countdown-label">Kaulinan Dimimitian</div>
        <div className="countdown-number" key={count}>{count}</div>
        <div className="countdown-sub">
          Siang geus datang... Sanekala nyamar di antara urang!
        </div>
      </div>
    </div>
  );
}
