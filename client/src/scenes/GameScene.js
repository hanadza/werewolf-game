import React from 'react';
import RoleRevealOverlay from '../components/RoleRevealOverlay';
import Timer from '../components/Timer';


export default function GameScene({ state, actions, ROLES, PHASES, chatEndRef, username }) {
  const { phase, dayCount, phaseDuration, phaseMessage, showRoleReveal, setShowRoleReveal, myRole, teammates, sanekalaList, hasShield, ruqyahUsed, ruqyahAvailable, nightBlocked, actionConfirmed, nightInstruction, nightTargets, kuncenMode, setKuncenMode, isFirstDay, isAlive, myVote, voteTargets, lockedPlayers, votes, senjaResult, seerResult, eliminatedInfo, ajenganWasiat, isHost, hostRoleInfo, players, chatMessages, chatInput, setChatInput, soundEnabled, setSoundEnabled, canChat, phaseData } = state;
  const { sendNightAction, castVote, activateRuqyah, sendChat, endGame } = actions;
  const roleData = ROLES[myRole];

  return (
    <div className="game-screen"
      style={{ background: phaseData?.bg || '#1a1a2e' }}>

      {/* Role Reveal */}
      {showRoleReveal && (
        <RoleRevealOverlay
          role={myRole}
          teammates={teammates}
          onDone={() => setShowRoleReveal(false)}
        />
      )}

      {/* Game Layout */}
      <div className="game-layout">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">

          {/* Phase Header */}
          <div className="panel-card phase-card"
            style={{ borderColor: phaseData?.color }}>
            <div className="phase-title" style={{ color: phaseData?.color }}>
              {phaseData?.emoji} {phaseData?.label}
            </div>
            <div className="phase-day">Ronde {dayCount}</div>
            {phaseMessage && (
              <div className="phase-message">{phaseMessage}</div>
            )}
            {phase && phase !== 'malam' && (
              <Timer
                key={`${phase}-${dayCount}`}
                duration={phaseDuration}
                phase={phase}
              />
            )}
          </div>

          {/* Role Card */}
          {roleData && (
            <div className="panel-card role-card"
              style={{ borderColor: roleData.color, background: roleData.bg }}>
              <div className="role-card-header">
                <span className="role-card-label">PERAN MANEH</span>
                {myRole === 'werewolf' && (
                  <span className="sanekala-badge">👹 SANEKALA</span>
                )}
              </div>
              <div className="role-card-main">
                <span className="role-card-emoji">{roleData.emoji}</span>
                <span className="role-card-name"
                  style={{ color: roleData.color }}>
                  {roleData.name}
                </span>
              </div>
              <div className="role-card-desc">{roleData.desc}</div>

              {/* Sanekala: tampilkan sesama sanekala */}
              {myRole === 'werewolf' && sanekalaList.length > 0 && (
                <div className="sanekala-team">
                  <div className="sanekala-team-title">
                    👹 Batur Sanekala (Ngan maneh anu bisa ningali ieu):
                  </div>
                  {sanekalaList.map((s, i) => (
                    <div key={i} className={`sanekala-member ${!s.isAlive ? 'dead' : ''}`}>
                      <span className="sanekala-icon">👹</span>
                      <span>{s.username}</span>
                      {!s.isAlive && <span className="dead-tag">Tilar</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Kuncen shield status */}
              {myRole === 'kuncen' && (
                <div className="kuncen-shield-status">
                  {hasShield
                    ? '🛡️ Kebal masih aktif'
                    : '🛡️ Kebal geus dipake'}
                </div>
              )}

              {/* Ajengan ruqyah status */}
              {myRole === 'ajengan' && (
                <div className="ajengan-ruqyah-status">
                  {!ruqyahUsed
                    ? '🕌 Ruqyah Massal: Sadia'
                    : '🕌 Ruqyah Massal: Geus dipake'}
                </div>
              )}
            </div>
          )}



          {/* ── SENJA ACTIONS ── */}
          {phase === 'senja' && isAlive && (
            <>
              {/* Sanekala */}
              {myRole === 'werewolf' && !nightBlocked && !actionConfirmed && (
                <div className="panel-card action-card sanekala-action">
                  <div className="action-label">👹 AKSI SANEKALA</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn sanekala-target"
                        onClick={() => sendNightAction(t)}>
                        👦 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {myRole === 'werewolf' && nightBlocked && !actionConfirmed && (
                <div className="panel-card action-card blocked-action">
                  <div className="action-label">🕌 DIBLOKIR RUQYAH</div>
                  <p>Ruqyah Massal Ajengan ngahalangan aksi maneh senja ieu!</p>
                </div>
              )}

              {/* Dukun */}
              {myRole === 'seer' && !actionConfirmed && (
                <div className="panel-card action-card seer-action">
                  <div className="action-label">🔮 AKSI DUKUN</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn seer-target"
                        onClick={() => sendNightAction(t)}>
                        👤 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kolot */}
              {myRole === 'doctor' && !actionConfirmed && (
                <div className="panel-card action-card doctor-action">
                  <div className="action-label">👴 AKSI KOLOT</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn doctor-target"
                        onClick={() => sendNightAction(t)}>
                        👦 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kuncen */}
              {myRole === 'kuncen' && !actionConfirmed && (
                <div className="panel-card action-card kuncen-action">
                  <div className="action-label">🗝️ AKSI KUNCEN</div>
                  {!kuncenMode ? (
                    <>
                      <p className="action-instruction">{nightInstruction}</p>
                      {hasShield && (
                        <button className="target-btn kuncen-target"
                          onClick={() => setKuncenMode('shield')}>
                          🛡️ Gunakeun Kebal (Lindungi diri)
                        </button>
                      )}
                      <button className="target-btn kuncen-target"
                        onClick={() => setKuncenMode('lock')}>
                        🔒 Kunci Pamain (Skip vote)
                      </button>
                    </>
                  ) : kuncenMode === 'shield' ? (
                    <>
                      <p>Konfirmasi gunakeun kebal?</p>
                      <button className="target-btn kuncen-target"
                        onClick={() => sendNightAction(username, 'shield')}>
                        🛡️ Aktifkeun Kebal!
                      </button>
                      <button className="back-small-btn"
                        onClick={() => setKuncenMode('')}>
                        ← Balik
                      </button>
                    </>
                  ) : (
                    <>
                      <p>Pilih saha anu rék dikunci:</p>
                      <div className="target-grid">
                        {nightTargets.map((t, i) => (
                          <button key={i} className="target-btn kuncen-target"
                            onClick={() => sendNightAction(t, 'lock')}>
                            🔒 {t}
                          </button>
                        ))}
                      </div>
                      <button className="back-small-btn"
                        onClick={() => setKuncenMode('')}>
                        ← Balik
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Ajengan */}
              {myRole === 'ajengan' && !actionConfirmed && (
                <div className="panel-card action-card ajengan-action">
                  <div className="action-label">🕌 AKSI AJENGAN</div>
                  <p className="action-instruction">{nightInstruction}</p>
                  {ruqyahAvailable && !ruqyahUsed && (
                    <button className="ruqyah-btn" onClick={activateRuqyah}>
                      ✨ Aktifkeun Ruqyah Massal!
                      <span className="ruqyah-warning">
                        ⚠️ Sanekala bakal nyaho maneh Ajengan!
                      </span>
                    </button>
                  )}
                  <div className="target-grid">
                    {nightTargets.map((t, i) => (
                      <button key={i} className="target-btn ajengan-target"
                        onClick={() => sendNightAction(t)}>
                        🙏 {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Budak / Villager */}
              {myRole === 'villager' && (
                <div className="panel-card action-card villager-night">
                  <div className="action-label">👦 SENJA MENCEKAM</div>
                  <p>Geura balik ka imah! Senja geus datang!</p>
                  <p className="small-text">
                    Sanekala, Dukun, Kolot, Kuncen, jeung Ajengan keur ngalakukeun aksi...
                  </p>
                </div>
              )}

              {/* Action Confirmed */}
              {actionConfirmed && (
                <div className="panel-card confirmed-card">
                  ✅ {actionConfirmed}
                </div>
              )}
            </>
          )}

          {/* ── SIANG ACTIONS ── */}
          {phase === 'siang' && (
  <>
    {/* Hari Pertama - Tidak ada vote */}
    {isFirstDay && isAlive && (
      <div className="panel-card first-day-card">
        <div className="action-label">☀️ BEURANG KAHIJI</div>
        <div className="first-day-content">
          <div className="first-day-emoji">🌅</div>
          <p className="first-day-title">Wilujeng Sumping!</p>
          <p className="first-day-desc">
            Ieu mangrupa beurang kahiji di lembur.
            Kenalan heula jeung batur saméméh senja datang!
          </p>
          <p className="first-day-desc">
            Teu aya sidang ayeuna. Senja bakal datang...
            Sanekala bakal ngaliar!
          </p>
          <div className="first-day-warning">
            ⚠️ Ati-ati! Sanekala aya di antara urang!
          </div>
        </div>
      </div>
    )}

    {/* Ajengan Ruqyah Massal Button */}
    {!isFirstDay && myRole === 'ajengan' && isAlive && !ruqyahUsed && (
                <div className="panel-card action-card ajengan-action">
                  <div className="action-label">🕌 RUQYAH MASSAL</div>
                  <p>Gunakeun Ruqyah Massal pikeun ngahalangan Sanekala senja ieu!</p>
                  <button className="ruqyah-btn" onClick={activateRuqyah}>
                    ✨ Aktifkeun Ruqyah Massal!
                    <span className="ruqyah-warning">
                      ⚠️ Sanekala bakal nyaho maneh Ajengan!
                    </span>
                  </button>
                </div>
              )}

              {/* Voting - hanya hari ke-2 dst */}
                  {!isFirstDay && isAlive && !myVote && voteTargets.length > 0 && (
                  <div className="panel-card action-card vote-card">
                  <div className="action-label">🗳️ SIDANG LEMBUR</div>
                  <p className="action-instruction">
                    Saha anu maneh curiga jadi Sanekala?
                  </p>
                  {lockedPlayers.length > 0 && (
                    <div className="locked-notice">
                      🔒 {lockedPlayers.join(', ')} dikunci ku Kuncen!
                    </div>
                  )}
                  <div className="target-grid">
                    {voteTargets.map((t, i) => (
                      <button key={i}
                        className={`target-btn vote-target ${lockedPlayers.includes(t) ? 'locked' : ''}`}
                        onClick={() => castVote(t)}
                        disabled={lockedPlayers.includes(t)}
                      >
                        {lockedPlayers.includes(t) ? '🔒' : '🪓'} {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isFirstDay && myVote && (
                <div className="panel-card confirmed-card">
                  ✅ Maneh milih ngusir: <strong>{myVote}</strong>
                </div>
              )}

              {/* Vote Tracker */}
              {!isFirstDay && Object.keys(votes).length > 0 && (
                <div className="panel-card vote-tracker-card">
                  <div className="action-label">📊 HASIL PILIHAN</div>
                  {Object.entries(votes).map(([voter, target], i) => (
                    <div key={i} className="vote-row">
                      <span>👤 {voter}</span>
                      <span className="vote-arrow">→</span>
                      <span>🪓 {target}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── MALAM RESULTS ── */}
          {phase === 'malam' && senjaResult && (
            <div className="panel-card malam-result-card">
              <div className="action-label">🌙 KAAYAAN LEMBUR</div>
              {senjaResult.killed ? (
                <div className="result-killed">
                  😱 <strong>{senjaResult.killed}</strong> kapanggih leungit!
                  <br />Diculik ku Sanekala!
                </div>
              ) : (
                <div className="result-safe">
                  🎉 Sadaya urang salamet senja ieu!
                </div>
              )}
              {senjaResult.protectedBy && (
                <div className="result-protected">
                  🛡️ Hiji urang diselamatkeun ku{' '}
                  {senjaResult.protectedBy === 'kolot' ? 'Kolot 👴'
                    : senjaResult.protectedBy === 'ajengan' ? 'Ajengan 🕌'
                    : 'Kuncen 🗝️'}!
                </div>
              )}
              {senjaResult.lockedPlayer && (
                <div className="result-locked">
                  🔒 <strong>{senjaResult.lockedPlayer}</strong> dikunci ku Kuncen!
                  Teu bisa divote ronde ieu!
                </div>
              )}
            </div>
          )}

          {/* Seer Result */}
          {seerResult && (
            <div className="panel-card seer-result-card">
              <div className="action-label">🔮 PANON DUKUN</div>
              <p>
                <strong>{seerResult.target}</strong> téh nyaéta{' '}
                <strong style={{ color: ROLES[seerResult.role]?.color }}>
                  {ROLES[seerResult.role]?.emoji} {ROLES[seerResult.role]?.name}
                </strong>!
              </p>
              {seerResult.isSanekala && (
                <p className="warning-text">
                  ⚠️ Manéhna téh Sanekala! Ati-ati!
                </p>
              )}
            </div>
          )}

          {/* Eliminated Info */}
          {eliminatedInfo && (
            <div className="panel-card eliminated-card">
              <div className="action-label">⚖️ KAPUTUSAN SIDANG</div>
              <p>
                🪓 <strong>{eliminatedInfo.username}</strong> diusir tina lembur!
                <br />Manéhna téh{' '}
                <strong style={{ color: ROLES[eliminatedInfo.role]?.color }}>
                  {ROLES[eliminatedInfo.role]?.emoji} {ROLES[eliminatedInfo.role]?.name}
                </strong>!
              </p>
            </div>
          )}

          {/* Ajengan Wasiat */}
          {ajenganWasiat && (
            <div className="panel-card wasiat-card">
              <div className="action-label">📜 WASIAT AJENGAN</div>
              <p>{ajenganWasiat}</p>
            </div>
          )}

          {/* Dead Player */}
          {!isAlive && (
            <div className="panel-card dead-card">
              💀 Maneh geus tilar dunya...
              <br />Saksian wé jalannya kaulinan
            </div>
          )}

          {/* Host Controls in Game */}
          {isHost && (
            <div className="panel-card host-game-controls">
              <div className="action-label">👑 KONTROL HOST</div>
              <button className="btn-danger" onClick={endGame}>
                ⏹️ Akhiri Kaulinan
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">

          {/* Players */}
          <div className="panel-card players-card">
            <h3>👥 Urang Lembur
              <span className="alive-count">
                ({players.filter(p => p.isAlive).length} hirup)
              </span>
            </h3>
            <ul className="game-players-list">
              {players.map((p, i) => {
                const isSanekala = myRole === 'werewolf' &&
                  sanekalaList.find(s => s.username === p.username);
                return (
                  <li key={i} className={`game-player-item ${!p.isAlive ? 'dead' : ''} ${p.isLocked ? 'locked' : ''}`}>
                    <span className="game-player-icon">
                      {!p.isAlive ? '💀' : isSanekala ? '👹' : '👤'}
                    </span>
                    <span className="game-player-name">
                      {p.username}
                      {p.username === username && (
                        <span className="you-tag">(Maneh)</span>
                      )}
                    </span>
                    <div className="game-player-badges">
                      {isSanekala && p.isAlive && (
                        <span className="sanekala-tag">👹</span>
                      )}
                      {p.isLocked && (
                        <span className="locked-tag">🔒</span>
                      )}
                      {!p.isAlive && (
                        <span className="dead-tag-sm">Tilar</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Chat */}
          <div className="panel-card chat-card">
            <div className="chat-header">
              <h3>
                {phase === 'senja' && myRole === 'werewolf'
                  ? '👹 Bisikan Sanekala'
                  : phase === 'senja'
                  ? '🌅 Senja Jempe...'
                  : '☀️ Obrolan Lembur'}
              </h3>
              {phase === 'senja' && myRole === 'werewolf' && (
                <span className="chat-private-badge">🔒 Privat</span>
              )}
            </div>

            <div className="chat-messages" ref={chatEndRef}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-msg chat-${msg.type}`}>
                  {msg.type !== 'system' && (
                    <span className="chat-username"
                      style={{ color: msg.type === 'sanekala' ? '#e94560' : '#f39c12' }}>
                      {msg.type === 'sanekala' ? '👹' : '👤'} {msg.username}
                    </span>
                  )}
                  <span className="chat-text">{msg.message}</span>
                  <span className="chat-time">{msg.timestamp}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {canChat ? (
              <div className="chat-input-row">
                <input
                  className="chat-input"
                  placeholder={
                    phase === 'senja'
                      ? 'Bisik ka batur Sanekala...'
                      : 'Omongkeun pamadegan maneh...'
                  }
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                />
                <button className="chat-send-btn" onClick={sendChat}>
                  Kirim
                </button>
              </div>
            ) : (
              <div className="chat-disabled">
                {phase === 'senja'
                  ? '🌅 Jempe... senja keur mencekam'
                  : phase === 'malam'
                  ? '🌙 Peuting... ngantosan beurang'
                  : '💀 Arwah maneh teu bisa ngomong'}
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            className="sound-toggle-btn-game"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? '🔊 Suara ON' : '🔇 Suara OFF'}
          </button>
        </div>
      </div>
    </div>
  );

}
