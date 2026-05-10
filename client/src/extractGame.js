const fs = require('fs');
const path = require('path');

const appFile = path.join(__dirname, 'App.js');
let content = fs.readFileSync(appFile, 'utf8');

// Use string splitting for robustness
const lines = content.split(/\r?\n/);

const gameStartIndex = lines.findIndex(l => l.includes("if (screen === 'game') return ("));
const gameEndIndex = lines.findIndex(l => l.includes("SCREEN: GAME OVER"));

if (gameStartIndex === -1 || gameEndIndex === -1) {
  console.error("Could not find Game scene boundaries.", gameStartIndex, gameEndIndex);
  process.exit(1);
}

const gameJsxLines = lines.slice(gameStartIndex + 1, gameEndIndex - 1);
const gameJsx = gameJsxLines.join('\n');

const gameSceneCode = 
  "import React from 'react';\n" +
  "import RoleRevealOverlay from '../components/RoleRevealOverlay';\n" +
  "import Timer from '../components/Timer';\n" +
  "import HostMonitor from '../components/HostMonitor';\n\n" +
  "export default function GameScene({ state, actions, ROLES, PHASES, chatEndRef, username }) {\n" +
  "  const { phase, dayCount, phaseDuration, phaseMessage, showRoleReveal, setShowRoleReveal, myRole, teammates, sanekalaList, hasShield, ruqyahUsed, ruqyahAvailable, nightBlocked, actionConfirmed, nightInstruction, nightTargets, kuncenMode, setKuncenMode, isFirstDay, isAlive, myVote, voteTargets, lockedPlayers, votes, senjaResult, seerResult, eliminatedInfo, ajenganWasiat, isHost, hostRoleInfo, players, chatMessages, chatInput, setChatInput, soundEnabled, setSoundEnabled, canChat, phaseData } = state;\n" +
  "  const { sendNightAction, castVote, activateRuqyah, sendChat, endGame } = actions;\n" +
  "  const roleData = ROLES[myRole];\n\n" +
  "  return (\n" +
  gameJsx + "\n" +
  "}\n";

fs.writeFileSync(path.join(__dirname, 'scenes', 'GameScene.js'), gameSceneCode);

// Now for App.js itself
// We need to strip out ROLES, PHASES, Components from App.js as they were moved.
// And we replace the screens with the Scene imports.

const mainAppIndex = lines.findIndex(l => l.includes("function App() {"));

let importsCode = 
  "import React, { useState, useEffect, useRef, useCallback } from 'react';\n" +
  "import io from 'socket.io-client';\n" +
  "import './App.css';\n" +
  "import { ROLES, PHASES } from './constants/gameConfig';\n" +
  "import { playSound, stopAllSounds } from './utils/soundManager';\n" +
  "import CountdownOverlay from './components/CountdownOverlay';\n" +
  "import TransitionOverlay from './components/TransitionOverlay';\n" +
  "import LandingScene from './scenes/LandingScene';\n" +
  "import CreateRoomScene from './scenes/CreateRoomScene';\n" +
  "import JoinRoomScene from './scenes/JoinRoomScene';\n" +
  "import LobbyScene from './scenes/LobbyScene';\n" +
  "import GameScene from './scenes/GameScene';\n" +
  "import GameOverScene from './scenes/GameOverScene';\n\n" +
  "const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001');\n\n";

const computedStartIndex = lines.findIndex(l => l.includes("── Computed ──"));

// Everything inside App function until Computed
const appBodyTop = lines.slice(mainAppIndex, computedStartIndex).join('\n');

const appBottomCode = 
  "  // ── Computed ──\n" +
  "  const myPlayer = players.find(p => p.username === username);\n" +
  "  const isAlive = myPlayer?.isAlive ?? true;\n" +
  "  const roleData = ROLES[myRole];\n" +
  "  const phaseData = PHASES[phase];\n" +
  "  const canChat = (phase === 'siang' && isAlive) ||\n" +
  "    (phase === 'senja' && myRole === 'werewolf' && isAlive);\n\n" +
  "  const state = {\n" +
  "    screen, setScreen, username, setUsername, isHost, setIsHost,\n" +
  "    roomName, setRoomName, maxPlayers, setMaxPlayers, currentRoom, currentRoomName,\n" +
  "    players, joinCode, setJoinCode, myRole, teammates, sanekalaList, phase,\n" +
  "    isFirstDay, dayCount, phaseMessage, phaseDuration, nightTargets, nightInstruction,\n" +
  "    nightBlocked, hasShield, kuncenMode, setKuncenMode, actionConfirmed, ruqyahAvailable,\n" +
  "    ruqyahUsed, voteTargets, votes, myVote, lockedPlayers, senjaResult, seerResult,\n" +
  "    eliminatedInfo, ajenganWasiat, countdown, showRoleReveal, setShowRoleReveal,\n" +
  "    transition, chatMessages, chatInput, setChatInput, error, soundEnabled, setSoundEnabled,\n" +
  "    gameOver, hostRoleInfo, canChat, phaseData, isAlive\n" +
  "  };\n\n" +
  "  const actions = {\n" +
  "    createRoom, joinRoom, startGame, endGame, restartGame, kickPlayer,\n" +
  "    sendNightAction, castVote, activateRuqyah, sendChat\n" +
  "  };\n\n" +
  "  // ── Render Overlays ──\n" +
  "  if (countdown !== null) return <CountdownOverlay count={countdown} />;\n" +
  "  if (transition) return (\n" +
  "    <TransitionOverlay\n" +
  "      from={transition.from}\n" +
  "      to={transition.to}\n" +
  "      duration={transition.duration}\n" +
  "    />\n" +
  "  );\n\n" +
  "  if (screen === 'landing') return <LandingScene state={state} ROLES={ROLES} />;\n" +
  "  if (screen === 'create') return <CreateRoomScene state={state} actions={actions} />;\n" +
  "  if (screen === 'join') return <JoinRoomScene state={state} actions={actions} />;\n" +
  "  if (screen === 'lobby') return <LobbyScene state={state} actions={actions} ROLES={ROLES} socket={socket} />;\n" +
  "  if (screen === 'game') return <GameScene state={state} actions={actions} ROLES={ROLES} PHASES={PHASES} chatEndRef={chatEndRef} username={username} />;\n" +
  "  if (screen === 'gameover') return <GameOverScene state={state} actions={actions} ROLES={ROLES} />;\n\n" +
  "  return null;\n" +
  "}\n\n" +
  "export default App;\n";

const finalAppCode = importsCode + appBodyTop + '\n' + appBottomCode;

fs.writeFileSync(appFile, finalAppCode);

console.log("Extraction successful and App.js is fully clean.");
