import React from 'react';

export default function CountdownOverlay({ count }) {
  return (
    <div className="fullscreen-overlay countdown-overlay">
      <div className="countdown-content">
        <div className="countdown-label">Permainan Dimulai</div>
        <div className="countdown-number" key={count}>{count}</div>
        <div className="countdown-sub">
          Siang sudah datang... Sanekala menyamar di antara kita!
        </div>
      </div>
    </div>
  );
}
