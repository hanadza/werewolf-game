# 👹 Sandekala Village

<div align="center">

> *"Saha Sanekala di antara urang?"*
>
> *"Siapakah Sanekala di antara kita?"*

![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)
![React](https://img.shields.io/badge/React-18.2.0-61dafb?style=flat-square&logo=react)
![NodeJS](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=nodedotjs)
![SocketIO](https://img.shields.io/badge/Socket.io-4.7.2-010101?style=flat-square&logo=socketdotio)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1?style=flat-square&logo=mysql)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)
![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E?style=flat-square&logo=railway)

</div>

---

## 🌐 Live Demo

<div align="center">
Platform

URL

🎮 **Game (Frontend)

sandekala-village.vercel.app

🚀 **Server (Backend)

Railway

📦 **Source Code

github.com/hanadza/sandekala-village

</div>
📖 Tentang Game
Sandekala Village adalah game web multiplayer real-time berbasis legenda rakyat Sunda - Jawa Barat. Terinspirasi dari mitos Sanekala, makhluk gaib yang dipercaya muncul saat waktu senja/Maghrib dan mengincar anak-anak yang masih berada di luar rumah.

🌙 Asal Usul Mitos Sanekala
Kata "Sanekala" berasal dari bahasa Sunda:

"Saka" = dari/waktu
"Kala" = maut/senja
Dalam kepercayaan masyarakat Sunda, Sanekala adalah makhluk gaib yang berkeliaran saat waktu Maghrib/senja. Para orang tua selalu memperingatkan anak-anak untuk segera pulang ke rumah sebelum senja tiba, karena Sanekala dipercaya akan menculik anak-anak yang masih berada di luar rumah.

Game ini mengangkat mitos tersebut menjadi sebuah permainan deduksi sosial (social deduction game) yang dimainkan secara multiplayer real-time, di mana satu atau lebih pemain menyamar sebagai Sanekala dan harus menculik warga tanpa ketahuan.

🎭 Peran dalam Game
Peran

Emoji

Deskripsi

Kemampuan

Sanekala

👹

Makhluk jelmaan yang menyamar jadi warga biasa

Saat senja berubah wujud & menculik budak. Bisa chat sesama Sanekala secara privat

Dukun

🔮

Orang pintar kampung yang bisa melihat hal gaib

Setiap senja intip identitas sejati 1 pemain

Kolot

👴

Orangtua yang melindungi anak dari Sanekala

Setiap senja lindungi 1 pemain dari culikan Sanekala

Kuncen

🗝️

Penjaga tempat keramat dengan kekuatan leluhur

Kebal 1x dari serangan Sanekala + kunci 1 pemain dari voting

Ajengan

🕌

Tokoh agama yang dihormati warga lembur

Lindungi warga dengan doa + 1x Ruqyah Massal (blokir Sanekala)

Budak

👦

Anak-anak warga yang jadi target Sanekala

Target utama Sanekala, harus temukan & usir Sanekala!

📊 Syarat Jumlah Pemain

Copy code
3 - 5  pemain  →  Sanekala + Budak
4  +   pemain  →  + Dukun    🔮
6  +   pemain  →  + Kolot    👴
7  +   pemain  →  + Kuncen   🗝️
8  +   pemain  →  + Ajengan  🕌
🌅 Alur Permainan

Copy code
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   ☀️  SIANG (60 detik) - Sidang Lembur               ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ║
║   • Sanekala menyamar jadi warga biasa               ║
║   • Semua pemain diskusi di chat                     ║
║   • Vote untuk mengusir pemain yang dicurigai        ║
║   • Pemain dengan vote terbanyak = diusir!           ║
║                          ↓                           ║
║   🌅  SENJA (30 detik) - Sanekala Ngaliar            ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ║
║   • 👹 Sanekala  → Pilih budak untuk diculik         ║
║   • 🔮 Dukun     → Intip identitas 1 pemain          ║
║   • 👴 Kolot     → Lindungi 1 pemain                 ║
║   • 🗝️  Kuncen   → Pilih: kebal ATAU kunci pemain    ║
║   • 🕌 Ajengan   → Doakan 1 pemain / Ruqyah Massal   ║
║   • 👦 Budak     → Berdoa di dalam rumah...          ║
║                          ↓                           ║
║   🌙  MALAM (15 detik) - Kaayaan Lembur              ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ║
║   • Pengumuman: siapa yang diculik / selamat         ║
║   • Suasana mencekam menunggu siang                  ║
║                          ↓                           ║
║              🔄 Ulangi dari SIANG                    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
🏆 Kondisi Menang
Pemenang

Kondisi

🏆 **Urang Lembur

Semua Sanekala berhasil diusir dari lembur

👹 **Sanekala

Jumlah Sanekala >= jumlah warga yang tersisa

✨ Fitur Utama
🎮 Gameplay
✅ Multiplayer Real-time - Bermain bersama teman secara online
✅ 3 Fase Waktu - Siang → Senja → Malam (sesuai mitos Sanekala)
✅ 6 Peran Unik - Masing-masing dengan kemampuan berbeda
✅ Voting System - Vote real-time dengan tracker
✅ Chat System - Obrolan siang & bisikan rahasia Sanekala
👑 Host System
✅ Host Monitor - Host bisa lihat semua peran pemain
✅ Atur Pemain - Host atur jumlah maksimal pemain (3-20)
✅ Kick Player - Host bisa keluarkan pemain nakal
✅ Restart Game - Host bisa mulai ulang tanpa keluar room
✅ End Game - Host bisa akhiri game kapan saja
✅ Lobby Persist - Pemain tetap di lobby setelah game selesai
🎨 UI/UX
✅ Animasi Transisi - Perpindahan fase yang dramatis & mencekam
✅ Role Reveal - Animasi reveal peran di awal game
✅ Countdown - Hitungan mundur 3 detik sebelum game dimulai
✅ Timer Visual - Timer berubah warna merah saat waktu hampir habis
✅ Sound Effects - Efek suara setiap fase & aksi
✅ Responsive - Support HP & PC
🇮🇩 Kearifan Lokal Sunda
✅ Tema Sunda - Nama peran & narasi dalam bahasa Sunda
✅ Lore Autentik - Berdasarkan mitos Sanekala asli Jawa Barat
✅ Tokoh Lokal - Ajengan, Kuncen, Kolot = tokoh khas masyarakat Sunda
🛠️ Tech Stack
<div align="center">
Layer

Technology

Kegunaan

Frontend

React.js 18

UI & komponen game

Realtime

Socket.io

Komunikasi real-time

Backend

Node.js + Express.js

Server & game logic

Database

MySQL 8.0

Penyimpanan data room

Frontend Deploy

Vercel

Hosting frontend

Backend Deploy

Railway

Hosting backend + database

Version Control

Git + GitHub

Source control

</div>
🚀 Instalasi & Menjalankan Lokal
Prerequisites
bash

Copy code
Node.js >= 16.x
MySQL  >= 8.0
npm    >= 8.x
1️⃣ Clone Repository
bash

Copy code
git clone https://github.com/hanadza/sandekala-village.git
cd sandekala-village
2️⃣ Setup Database MySQL
bash

Copy code
mysql -u root -p
sql

Copy code
CREATE DATABASE werewolf_game;
USE werewolf_game;

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  max_players INT DEFAULT 8,
  status ENUM('waiting','playing','finished') DEFAULT 'waiting',
  creator_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE room_players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT,
  user_id INT,
  role VARCHAR(20),
  is_alive BOOLEAN DEFAULT true,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
3️⃣ Setup Backend (Server)
bash

Copy code
cd server
npm install
Buat file .env di folder server/:

env

Copy code
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=werewolf_game
DB_PORT=3306
bash

Copy code
# Development
npm run dev

# Production
npm start

# Server berjalan di http://localhost:5000
4️⃣ Setup Frontend (Client)
bash

Copy code
cd ../client
npm install
Buat file .env di folder client/:

env

Copy code
CI=false
REACT_APP_SERVER_URL=http://localhost:5000
bash

Copy code
npm start
# App berjalan di http://localhost:3000
📁 Struktur Project

Copy code
sandekala-village/
│
├── 📁 client/                    # React Frontend
│   ├── 📁 public/
│   │   ├── 📁 sounds/            # Sound effects (.mp3)
│   │   │   ├── siang.mp3         # Suara fase siang
│   │   │   ├── senja.mp3         # Suara fase senja
│   │   │   ├── malam.mp3         # Suara fase malam
│   │   │   ├── wolf.mp3          # Lolongan Sanekala
│   │   │   ├── eliminated.mp3    # Suara eliminasi
│   │   │   ├── vote.mp3          # Suara voting
│   │   │   ├── win.mp3           # Suara menang
│   │   │   ├── lose.mp3          # Suara kalah
│   │   │   ├── countdown.mp3     # Suara countdown
│   │   │   ├── join.mp3          # Suara join room
│   │   │   └── transition.mp3    # Suara transisi fase
│   │   └── index.html
│   ├── 📁 src/
│   │   ├── App.js                # Main React component
│   │   └── App.css               # Styles & animations
│   ├── .env                      # Environment variables
│   └── package.json
│
├── 📁 server/                    # Node.js Backend
│   ├── server.js                 # Main server + game logic
│   ├── .env                      # Environment variables
│   └── package.json
│
└── README.md
🎮 Panduan Bermain
Sebagai 👑 Host:

Copy code
1. Buka game → Klik "Jieun Rohangan" (Buat Ruangan)
2. Isi nama & nama ruangan
3. Atur jumlah pemain maksimal dengan slider (3-20)
4. Bagikan kode room ke teman-teman
5. Tunggu semua masuk → Klik "Mimitian Kaulinan!"
6. Monitor semua peran pemain dari panel Host
7. Bisa kick player, end game, atau restart kapan saja
Sebagai 👤 Pemain:

Copy code
1. Buka game → Klik "Asup Rohangan" (Masuk Ruangan)
2. Isi nama & kode ruangan dari host
3. Tunggu host memulai permainan
4. Animasi reveal peranmu akan muncul
5. Ikuti instruksi setiap fase!
💡 Tips per Peran
Peran

Tips Bermain

👹 **Sanekala

Pura-pura aktif cari Sanekala. Jangan vote terlalu random atau terlalu diam

🔮 **Dukun

Beri clue pelan-pelan. Jangan langsung reveal - bisa jadi target Sanekala!

👴 **Kolot

Prioritaskan lindungi Dukun kalau sudah ketahuan identitasnya

🗝️ **Kuncen

Simpan kebal untuk momen yang tepat. Kunci pemain paling berbahaya

🕌 **Ajengan

Ruqyah Massal adalah senjata pamungkas! Pakai saat situasi paling kritis

👦 **Budak

Perhatikan tingkah laku mencurigakan. Siapa yang terlalu diam atau terlalu aktif?

⚖️ Tabel Keseimbangan Peran
Pemain

👹 Sanekala

🔮 Dukun

👴 Kolot

🗝️ Kuncen

🕌 Ajengan

👦 Budak

3

1

2

4

1

✅

2

5

1

✅

3

6

1

✅

✅

3

7

1

✅

✅

✅

3

8

2

✅

✅

✅

✅

2

10

2

✅

✅

✅

✅

4

12

3

✅

✅

✅

✅

5

15

4

✅

✅

✅

✅

7

20

5

✅

✅

✅

✅

11

🌍 Konfigurasi Deployment
Frontend - Vercel

Copy code
Framework Preset : Create React App
Root Directory   : client
Build Command    : npm run build
Output Directory : build
Backend - Railway

Copy code
Root Directory : server
Start Command  : node server.js
Environment Variables
Vercel (Frontend):

env

Copy code
CI                    = false
REACT_APP_SERVER_URL  = https://your-railway-url.up.railway.app
Railway (Backend):

env

Copy code
DB_HOST     = (dari MySQL Railway)
DB_USER     = (dari MySQL Railway)
DB_PASSWORD = (dari MySQL Railway)
DB_NAME     = (dari MySQL Railway)
DB_PORT     = (dari MySQL Railway)
🐛 Troubleshooting
Masalah

Kemungkinan Penyebab

Solusi

Tidak bisa create room

Server tidak konek

Cek Console browser (F12), pastikan Railway online

CORS Error

URL server salah

Pastikan REACT_APP_SERVER_URL sudah benar di Vercel

Database Error

Variabel DB kosong

Cek Variables Railway, pastikan semua DB_* terisi

Build Vercel gagal

ESLint error / CI=true

Pastikan CI=false ada di Environment Variables Vercel

Socket tidak konek

Server mati

Buka URL Railway langsung, cek status server

Room tidak ditemukan

Server restart

Room hilang karena server restart (in-memory)

🗺️ Roadmap
[x] ✅ Basic multiplayer game
[x] ✅ 6 peran unik berbasis budaya Sunda
[x] ✅ 3 fase waktu (Siang → Senja → Malam)
[x] ✅ Timer visual per fase
[x] ✅ Host system (monitor, kick, restart)
[x] ✅ Chat system + chat privat Sanekala
[x] ✅ Animasi transisi & role reveal
[x] ✅ Tema & bahasa Sunda
[x] ✅ Responsive design
[ ] 🔲 Sound effects lengkap
[ ] 🔲 Avatar pemain
[ ] 🔲 Leaderboard & statistik
[ ] 🔲 Game history & replay
[ ] 🔲 QR Code untuk join room
[ ] 🔲 Spectator mode
[ ] 🔲 Role tambahan
👥 Tim Pengembang
<div align="center">
Nama

NIM

Role

Hanadza

Full Stack Developer

Mata Kuliah: Pemrograman Web

Program Studi: S1 Informatika

Semester: 4 - 2025

</div>
📚 Referensi
📖 Mitos Sanekala - Legenda Sunda
🎮 Werewolf/Mafia Game Rules
⚡ Socket.io Documentation
⚛️ React Documentation
🚂 Railway Documentation
▲ Vercel Documentation
📝 Lisensi

Copy code
MIT License
Copyright (c) 2025 Hanadza
<div align="center">
Dibuat dengan ❤️ untuk Tugas Mata Kuliah Pemrograman Web

📚 S1 Informatika - Semester 4 - 2025

👹 "Balik ka imah sateuacan senja tiba..." 👹

"Pulanglah sebelum senja tiba..."

</div> ``
