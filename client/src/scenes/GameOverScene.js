import React from 'react';

export default function GameOverScene({ state, actions, ROLES }) {
  const { gameOver, isHost } = state;
  const { restartGame, endGame } = actions;

  return (
    <div className="gameover-screen"
      style={{
        background: gameOver?.winner === 'warga'
          ? 'linear-gradient(135deg, #0a2e0a, #1a4a1a, #0a2e0a)'
          : 'linear-gradient(135deg, #2e0a0a, #4a1a1a, #2e0a0a)'
      }}>
      <div className="gameover-card">
        <div className="gameover-result">
          <div className="gameover-emoji">
            {gameOver?.winner === 'warga' ? '🏆' : '👹'}
          </div>
          <h1 style={{ color: gameOver?.winner === 'warga' ? '#2ecc71' : '#e94560' }}>
            {gameOver?.winner === 'warga' ? 'Urang Lembur Meunang!' : 'Sanekala Meunang!'}
          </h1>
          <div className="gameover-message">{gameOver?.message}</div>
        </div>

        <div className="role-reveal-section">
          <h3>📋 Jati Diri Sadaya Pamain:</h3>
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

        {isHost ? (
          <div className="gameover-host-controls">
            <button className="btn-primary" onClick={restartGame}>🔄 Ulin Deui!</button>
            <button className="btn-secondary" onClick={endGame}>🏠 Balik ka Lobby</button>
          </div>
        ) : (
          <div className="waiting-host">⏳ Ngantosan host pikeun mimitian deui...</div>
        )}
      </div>
    </div>
  );
}
