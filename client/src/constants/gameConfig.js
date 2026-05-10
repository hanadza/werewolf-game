export const ROLES = {
  werewolf: {
    name: 'Sanekala',
    emoji: '👹',
    color: '#e94560',
    desc: 'Maneh nyaéta Sanekala! Siang nyamar jadi warga biasa. Senja berubah wujud & culik budak!',
    bg: 'rgba(233,69,96,0.15)',
    secret: true
  },
  seer: {
    name: 'Dukun',
    emoji: '🔮',
    color: '#9b59b6',
    desc: 'Maneh nyaéta Dukun! Unggal senja, intip jati diri hiji pamain. Maneh bisa ningali wujud asli Sanekala!',
    bg: 'rgba(155,89,182,0.15)',
    secret: false
  },
  doctor: {
    name: 'Kolot',
    emoji: '👴',
    color: '#2ecc71',
    desc: 'Maneh nyaéta Kolot! Unggal senja, jaga hiji budak tina culikan Sanekala. Bisa jaga diri sorangan!',
    bg: 'rgba(46,204,113,0.15)',
    secret: false
  },
  kuncen: {
    name: 'Kuncen',
    emoji: '🗝️',
    color: '#e67e22',
    desc: 'Maneh nyaéta Kuncen! Kebal 1x tina serangan Sanekala. Bisa ngunci 1 pamain tina sidang!',
    bg: 'rgba(230,126,34,0.15)',
    secret: false
  },
  ajengan: {
    name: 'Ajengan',
    emoji: '🕌',
    color: '#1abc9c',
    desc: 'Maneh nyaéta Ajengan! Lindungi warga jeung doa. 1x Ruqyah Massal: Sanekala teu bisa ngalakukeun aksi!',
    bg: 'rgba(26,188,156,0.15)',
    secret: false
  },
  villager: {
    name: 'Budak',
    emoji: '👦',
    color: '#f39c12',
    desc: 'Maneh nyaéta Budak! Target utama Sanekala. Gunakeun akal pikeun manggihan Sanekala di antara urang!',
    bg: 'rgba(243,156,18,0.15)',
    secret: false
  }
};

export const PHASES = {
  siang: {
    label: 'Beurang - Sidang Lembur',
    emoji: '☀️',
    color: '#f39c12',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overlayBg: 'rgba(243,156,18,0.05)'
  },
  senja: {
    label: 'Senja - Sanekala Ngaliar',
    emoji: '🌅',
    color: '#e67e22',
    bg: 'linear-gradient(135deg, #2d1b00 0%, #8B4513 40%, #FF6B35 100%)',
    overlayBg: 'rgba(230,126,34,0.08)'
  },
  malam: {
    label: 'Peuting - Kaayaan Lembur',
    emoji: '🌙',
    color: '#9b59b6',
    bg: 'linear-gradient(135deg, #000000 0%, #0d0d1a 50%, #1a0a2e 100%)',
    overlayBg: 'rgba(155,89,182,0.08)'
  }
};
