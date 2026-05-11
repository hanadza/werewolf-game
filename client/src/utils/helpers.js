import React from 'react';

export function getRolePreview(count) {
  const sanekalaCount = count <= 5 ? 1
    : count <= 8 ? 2
    : count <= 12 ? 3
    : count <= 16 ? 4
    : 5;

  const roleList = [];
  roleList.push({ emoji: '👹', name: 'Sanekala', count: sanekalaCount, color: '#e94560' });
  if (count >= 4) roleList.push({ emoji: '🔮', name: 'Dukun', count: 1, color: '#9b59b6' });
  if (count >= 6) roleList.push({ emoji: '👴', name: 'Kolot', count: 1, color: '#2ecc71' });
  if (count >= 7) roleList.push({ emoji: '🗝️', name: 'Kuncen', count: 1, color: '#e67e22' });
  if (count >= 8) roleList.push({ emoji: '🕌', name: 'Ajengan', count: 1, color: '#1abc9c' });

  const specialCount = roleList.reduce((sum, r) => sum + r.count, 0);
  const villagerCount = count - specialCount;
  if (villagerCount > 0) {
    roleList.push({ emoji: '👦', name: 'Budak', count: villagerCount, color: '#f39c12' });
  }

  return (
    <div className="role-preview-chips">
      {roleList.map((r, i) => (
        <span 
          key={i} 
          className="role-preview-chip" 
          style={{ borderColor: `${r.color}44`, background: `${r.color}15` }}
        >
          {r.emoji} <span style={{ color: r.color }}>{r.name}</span>
          {r.count > 1 && <span className="role-count">×{r.count}</span>}
        </span>
      ))}
    </div>
  );
}
