import React, { useState } from 'react';
import { ROLES, PHASES } from '../constants/gameConfig';

export default function EncyclopediaModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('roles');

  const renderRoles = () => (
    <div className="encyclopedia-grid">
      {Object.entries(ROLES).map(([key, role]) => (
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
            {key === 'siang' && "Waktuna warga diskusi! Panggihan saha Sanekala di antara aranjeun, jeung usir ngaliwatan voting (sora panglobana)."}
            {key === 'senja' && "Waktuna mahluk gaib jeung warga nu boga kamampuh husus (Dukun, Kolot, jrrd) ngalakukeun aksina rerencepan."}
            {key === 'malam' && "Hasil tina aksi senja diumumkeun. Saha nu salamet, saha nu diculik. Siap-siap nyanghareupan beurang deui."}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGuide = () => (
    <div className="encyclopedia-guide">
      <h3>Cara Maén (How to Play)</h3>
      <ul>
        <li><strong>Tujuan Warga:</strong> Usir kabeh Sanekala tina lembur ngaliwatan voting waktu Siang.</li>
        <li><strong>Tujuan Sanekala:</strong> Culik warga nepi ka jumlah Sanekala leuwih loba atawa sarua jeung sésa warga.</li>
        <li><strong>Alur Waktu:</strong> Kaulinan digilir ti Siang (Diskusi & Vote) ➡️ Senja (Aksi Rahasia) ➡️ Peuting (Hasil Aksi).</li>
        <li><strong>Rahasia:</strong> Ulah gampang percaya ka sasaha! Saha waé bisa jadi Sanekala nu nyamar.</li>
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
