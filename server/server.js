const express = require('express');
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
  console.log(`🚀 Sandekala Village Server running on PORT ${PORT}`);
});
