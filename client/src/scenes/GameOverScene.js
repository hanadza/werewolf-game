import React from 'react';

export default function GameOverScene({ state, actions, ROLES }) {
  const { gameOver, isHost } = state;
  const { endGame, leaveRoom } = actions;

  const isWin = gameOver?.winner === 'warga';

  return (
    <div className="gameover-screen"
      style={{
        background: isWin
          ? 'linear-gradient(135deg, #0a2e0a, #1a4a1a, #0a2e0a)'
          : 'linear-gradient(135deg, #2e0a0a, #4a1a1a, #2e0a0a)'
      }}>
      <div className="gameover-card">

        {/* Result */}
        <div className="gameover-result">
          <div className="gameover-emoji">
            {isWin ? '🏆' : '👹'}
          </div>
          <h1 style={{ color: isWin ? '#2ecc71' : '#e94560' }}>
            {isWin ? 'Urang Lembur Meunang!' : 'Sanekala Meunang!'}
          </h1>
          <div className="gameover-message">{gameOver?.message}</div>
        </div>

        {/* Role Reveal */}
        <div className="role-reveal-section">
          <h3>Jati Diri Sadaya Pamain</h3>
          <div className="role-reveal-list">
            {gameOver?.roleReveal?.map((p, i) => {
              const r = ROLES[p.role];
              return (
                <div key={i} className={`role-reveal-item ${!p.isAlive ? 'dead' : ''}`} style={{ borderColor: r?.color }}>
                  <span>{p.isAlive ? '👤' : '💀'} {p.username}</span>
                  <span style={{ color: r?.color }}>{r?.emoji} {r?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions — same for host and player */}
        <div className="gameover-actions">
          {isHost ? (
            <button className="btn-primary" onClick={endGame}>
              Balik ka Room
            </button>
          ) : (
            <button className="btn-primary" disabled style={{opacity: 0.5, cursor: 'not-allowed'}}>
              Ngantosan host...
            </button>
          )}
          <button className="btn-danger" onClick={leaveRoom}>
            Kaluar Permainan
          </button>
        </div>

      </div>
    </div>
  );
}
