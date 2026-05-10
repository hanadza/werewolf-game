CREATE DATABASE IF NOT EXISTS werewolf_game;
USE werewolf_game;

CREATE TABLE IF NOT EXISTS rooms (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  room_code   VARCHAR(10) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  max_players INT DEFAULT 8,
  status      ENUM('waiting','playing','finished') DEFAULT 'waiting',
  creator_id  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_players (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  room_id  INT,
  user_id  INT,
  role     VARCHAR(20),
  is_alive BOOLEAN DEFAULT true,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
