export const ROLES = {
  werewolf: {
    name: 'Sanekala',
    emoji: '👹',
    color: '#e94560',
    desc: 'Kamu adalah Sanekala! Siang menyamar jadi warga biasa. Senja berubah wujud & culik warga!',
    bg: 'rgba(233,69,96,0.15)',
    secret: true
  },
  seer: {
    name: 'Dukun',
    emoji: '🔮',
    color: '#9b59b6',
    desc: 'Kamu adalah Dukun! Setiap senja, intip jati diri satu pemain. Kamu bisa melihat wujud asli Sanekala!',
    bg: 'rgba(155,89,182,0.15)',
    secret: false
  },
  doctor: {
    name: 'Kolot',
    emoji: '👴',
    color: '#2ecc71',
    desc: 'Kamu adalah Kolot! Setiap senja, jaga satu warga dari penculikan Sanekala. Bisa jaga diri sendiri!',
    bg: 'rgba(46,204,113,0.15)',
    secret: false
  },
  kuncen: {
    name: 'Kuncen',
    emoji: '🗝️',
    color: '#e67e22',
    desc: 'Kamu adalah Kuncen! Kebal 1x dari serangan Sanekala. Bisa mengunci 1 pemain dari sidang!',
    bg: 'rgba(230,126,34,0.15)',
    secret: false
  },
  ajengan: {
    name: 'Ajengan',
    emoji: '🕌',
    color: '#1abc9c',
    desc: 'Kamu adalah Ajengan! Lindungi warga dengan doa. 1x Ruqyah Massal: Sanekala tidak bisa melakukan aksi!',
    bg: 'rgba(26,188,156,0.15)',
    secret: false
  },
  villager: {
    name: 'Budak',
    emoji: '👦',
    color: '#f39c12',
    desc: 'Kamu adalah Budak! Target utama Sanekala. Gunakan akal untuk menemukan Sanekala di antara kita!',
    bg: 'rgba(243,156,18,0.15)',
    secret: false
  }
};

export const PHASES = {
  siang: {
    label: 'Siang - Sidang Desa',
    emoji: '☀️',
    color: '#f39c12',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overlayBg: 'rgba(243,156,18,0.05)'
  },
  senja: {
    label: 'Senja - Sanekala Berkeliaran',
    emoji: '🌅',
    color: '#e67e22',
    bg: 'linear-gradient(135deg, #2d1b00 0%, #8B4513 40%, #FF6B35 100%)',
    overlayBg: 'rgba(230,126,34,0.08)'
  },
  malam: {
    label: 'Malam - Keadaan Desa',
    emoji: '🌙',
    color: '#9b59b6',
    bg: 'linear-gradient(135deg, #000000 0%, #0d0d1a 50%, #1a0a2e 100%)',
    overlayBg: 'rgba(155,89,182,0.08)'
  }
};
