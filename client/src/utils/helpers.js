import React from 'react';

export function getRolePreview(count) {
  const roles = [];
  const sanekalaCount = count <= 5 ? 1
    : count <= 8 ? 2
    : count <= 12 ? 3
    : count <= 16 ? 4
    : 5;
  for (let i = 0; i < sanekalaCount; i++) roles.push('👹 Sanekala');
  if (count >= 4) roles.push('🔮 Dukun');
  if (count >= 6) roles.push('👴 Kolot');
  if (count >= 7) roles.push('🗝️ Kuncen');
  if (count >= 8) roles.push('🕌 Ajengan');
  const villagerCount = count - roles.length;
  for (let i = 0; i < villagerCount; i++) roles.push('👦 Budak');

  return (
    <div className="role-preview-chips">
      {roles.map((r, i) => (
        <span key={i} className="role-preview-chip">{r}</span>
      ))}
    </div>
  );
}
