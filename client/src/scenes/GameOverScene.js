import React from 'react';

export default function GameOverScene({ state, actions, ROLES }) {
  const { gameOver, isHost } = state;
  const { restartGame, endGame, leaveRoom } = actions;

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
                  <span style={{ color: r?.color }}>
                    {r?.emoji} {r?.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {isHost ? (
          <div className="gameover-host-controls">
            <button className="btn-primary" onClick={restartGame}>Ulin Deui!</button>
            <button className="btn-secondary" onClick={endGame}>Balik ka Lobby</button>
            <button className="btn-danger" onClick={leaveRoom}>Kaluar Rohangan</button>
          </div>
        ) : (
          <div className="gameover-player-controls">
            <div className="waiting-host">Ngantosan host...</div>
            <button className="btn-secondary" style={{marginTop: '12px'}} onClick={() => window.location.reload()}>
              Balik ka Lobby
            </button>
            <button className="btn-danger" style={{marginTop: '8px'}} onClick={leaveRoom}>
              Kaluar Rohangan
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
