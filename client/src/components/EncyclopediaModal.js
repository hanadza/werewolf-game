import React, { useState } from 'react';
import { ROLES, PHASES } from '../constants/gameConfig';

export default function EncyclopediaModal({ onClose, myRole }) {
  const [activeTab, setActiveTab] = useState('roles');

  // Jika myRole ada (di dalam game), hanya tampilkan role pemain sendiri
  const rolesToShow = myRole
    ? Object.fromEntries(
        Object.entries(ROLES).filter(([key]) => key === myRole)
      )
    : ROLES;

  const renderRoles = () => (
    <div className="encyclopedia-grid">
      {myRole && (
        <div className="encyclopedia-role-solo-hint">
          📜 Kamu hanya bisa melihat peranmu sendiri saat permainan berlangsung.
        </div>
      )}
      {Object.entries(rolesToShow).map(([key, role]) => (
        <div key={key} className="encyclopedia-role-card" style={{ borderColor: role.color }}>
          <div className="encyclopedia-role-header" style={{ background: role.bg }}>
            <span className="encyclopedia-emoji">{role.emoji}</span>
            <span className="encyclopedia-name" style={{ color: role.color }}>{role.name}</span>
          </div>
          <div className="encyclopedia-role-desc">{role.desc}</div>
        </div>
      ))}
    </div>
  );

  const renderPhases = () => (
    <div className="encyclopedia-phases">
      {Object.entries(PHASES).map(([key, phase]) => (
        <div key={key} className="encyclopedia-phase-card">
          <div className="encyclopedia-phase-header" style={{ color: phase.color }}>
            <span className="encyclopedia-emoji">{phase.emoji}</span> {phase.label}
          </div>
          <div className="encyclopedia-phase-desc">
            {key === 'siang' && "Waktunya warga diskusi! Temukan siapa Sanekala di antara kalian, dan usir melalui voting (suara terbanyak)."}
            {key === 'senja' && "Waktunya makhluk gaib dan warga yang punya kemampuan khusus (Dukun, Kolot, dll) melakukan aksinya diam-diam."}
            {key === 'malam' && "Hasil dari aksi senja diumumkan. Siapa yang selamat, siapa yang diculik. Bersiap menghadapi siang lagi."}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGuide = () => (
    <div className="encyclopedia-guide">
      <h3>Cara Maén (How to Play)</h3>
      <ul>
        <li><strong>Tujuan Warga:</strong> Usir semua Sanekala dari desa melalui voting saat Siang.</li>
        <li><strong>Tujuan Sanekala:</strong> Culik warga sampai jumlah Sanekala lebih banyak atau sama dengan sisa warga.</li>
        <li><strong>Alur Waktu:</strong> Kaulinan digilir ti Siang (Diskusi &amp; Vote) ➡️ Senja (Aksi Rahasia) ➡️ Peuting (Hasil Aksi).</li>
        <li><strong>Rahasia:</strong> Jangan gampang percaya pada siapapun! Siapa saja bisa jadi Sanekala yang menyamar.</li>
      </ul>
    </div>
  );

  return (
    <div className="encyclopedia-overlay" onClick={onClose}>
      <div className="encyclopedia-modal" onClick={e => e.stopPropagation()}>
        <button className="encyclopedia-close" onClick={onClose}>✖</button>
        <h2 className="encyclopedia-title">📖 Ensiklopedia Sandekala</h2>
        
        <div className="encyclopedia-tabs">
          <button className={`encyclopedia-tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>Peran</button>
          <button className={`encyclopedia-tab ${activeTab === 'phases' ? 'active' : ''}`} onClick={() => setActiveTab('phases')}>Fase Waktu</button>
          <button className={`encyclopedia-tab ${activeTab === 'guide' ? 'active' : ''}`} onClick={() => setActiveTab('guide')}>Panduan</button>
        </div>

        <div className="encyclopedia-content">
          {activeTab === 'roles' && renderRoles()}
          {activeTab === 'phases' && renderPhases()}
          {activeTab === 'guide' && renderGuide()}
        </div>
      </div>
    </div>
  );
}
