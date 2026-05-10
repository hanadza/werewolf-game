const fs = require('fs');
const path = require('path');

const gameLogicFile = path.join(__dirname, 'utils', 'gameLogic.js');
const content = fs.readFileSync(gameLogicFile, 'utf8');

const lines = content.split('\n');

const ioOnStart = lines.findIndex(l => l.includes("io.on('connection'"));
const logicStart = lines.findIndex(l => l.includes("function assignRoles"));
const serverListen = lines.findIndex(l => l.includes("const PORT = process.env.PORT"));

const socketLines = lines.slice(ioOnStart + 1, logicStart - 4);
const logicLines = lines.slice(logicStart, serverListen);

// Write sockets/index.js
const socketsStr = `const rooms = require('../state/rooms');
const db = require('../config/db');
const gameLogic = require('../utils/gameLogic');

module.exports = function(io) {
  io.on('connection', (socket) => {
${socketLines.join('\n').replace(/assignRoles\(/g, 'gameLogic.assignRoles(')
                .replace(/getPublicPlayers\(/g, 'gameLogic.getPublicPlayers(')
                .replace(/broadcastPlayers\(/g, 'gameLogic.broadcastPlayers(')
                .replace(/broadcastChat\(/g, 'gameLogic.broadcastChat(')
                .replace(/clearPhaseTimer\(/g, 'gameLogic.clearPhaseTimer(')
                .replace(/startSiangPhase\(/g, 'gameLogic.startSiangPhase(')
                .replace(/resolveSiangVote\(/g, 'gameLogic.resolveSiangVote(')
                .replace(/checkSenjaComplete\(/g, 'gameLogic.checkSenjaComplete(')
                .replace(/startTransition\(/g, 'gameLogic.startTransition(')
                .replace(/getRoleName\(/g, 'gameLogic.getRoleName(')
                .replace(/getMajorityVote\(/g, 'gameLogic.getMajorityVote(')
                }
  });
};
`;
fs.writeFileSync(path.join(__dirname, 'sockets', 'index.js'), socketsStr);

// Write utils/gameLogic.js
const logicStr = `const rooms = require('../state/rooms');
const db = require('../config/db');
const { PHASE_DURATION } = require('../config/constants');
let io;

function setIo(socketIo) { io = socketIo; }

${logicLines.join('\n')}

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
fs.writeFileSync(gameLogicFile, logicStr);

// Write server.js
const serverStr = `const express = require('express');
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

require('./config/db');
require('./utils/gameLogic').setIo(io);
require('./sockets/index')(io);

app.get('/', (req, res) => res.json({ status: 'Sandekala Village Server Running!' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Sandekala Village Server running on PORT \${PORT}\`);
});
`;
fs.writeFileSync(path.join(__dirname, 'server.js'), serverStr);

console.log('Fix successful');
