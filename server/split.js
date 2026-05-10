const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

const ioOnStart = content.indexOf(`io.on('connection', (socket) => {`);
const gameLogicStart = content.indexOf(`// ============================================================
// GAME LOGIC FUNCTIONS`);
const portStart = content.indexOf(`const PORT = process.env.PORT`);

const imports = content.substring(0, ioOnStart);
const socketLogic = content.substring(ioOnStart, gameLogicStart);
const gameLogic = content.substring(gameLogicStart, portStart);
const footers = content.substring(portStart);

// Create gameLogic.js
const gameLogicFile = `const rooms = require('../state/rooms');
const db = require('../config/db');
const { PHASE_DURATION } = require('../config/constants');
let io;

function setIo(socketIo) { io = socketIo; }

${gameLogic}

module.exports = {
  setIo,
  assignRoles,
  getPublicPlayers,
  getSanekalaPlayers,
  broadcastPlayers,
  broadcastChat,
  clearPhaseTimer,
  startSiangPhase,
  resolveSiangVote,
  startSenjaPhase,
  checkSenjaComplete,
  resolveSenja,
  startMalamPhase,
  startTransition,
  getMajorityVote,
  getRoleName,
  checkWinCondition,
  endGame
};
`;

fs.writeFileSync(path.join(__dirname, 'utils', 'gameLogic.js'), gameLogicFile);

// Create sockets/index.js
const socketsFile = `const rooms = require('../state/rooms');
const db = require('../config/db');
const gameLogic = require('../utils/gameLogic');

module.exports = function(io) {
  gameLogic.setIo(io);
  ${socketLogic.replace(/assignRoles\(/g, 'gameLogic.assignRoles(')
                .replace(/getPublicPlayers\(/g, 'gameLogic.getPublicPlayers(')
                .replace(/broadcastPlayers\(/g, 'gameLogic.broadcastPlayers(')
                .replace(/broadcastChat\(/g, 'gameLogic.broadcastChat(')
                .replace(/clearPhaseTimer\(/g, 'gameLogic.clearPhaseTimer(')
                .replace(/startSiangPhase\(/g, 'gameLogic.startSiangPhase(')
                .replace(/resolveSiangVote\(/g, 'gameLogic.resolveSiangVote(')
                .replace(/checkSenjaComplete\(/g, 'gameLogic.checkSenjaComplete(')
                }
};
`;

fs.writeFileSync(path.join(__dirname, 'sockets', 'index.js'), socketsFile);

// Update server.js
const newServerJs = `const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.options('*', cors({ origin: "*" }));

const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST", "OPTIONS"], credentials: false },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

require('./config/db'); // Initialize DB
require('./sockets/index')(io); // Initialize Sockets

app.get('/', (req, res) => res.json({ status: 'Sandekala Village Server Running!' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

${footers}
`;

fs.writeFileSync(serverFile, newServerJs);

console.log('Split successful');
