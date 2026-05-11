import React from 'react';

export default function PublicRoomsList({ publicRooms, username, joinRoom, showError }) {
  const handleJoinRoom = (room) => {
    const isFull = room.playersCount >= room.maxPlayers;
    const isPlaying = room.phase !== 'lobby';
    if (isFull || isPlaying) return;
    if (!username.trim()) return showError('Eusi ngaran heula!');
    joinRoom(room.code);
  };

  return (
    <div className="landing-rooms">
      <div className="rooms-header">
        <h3 className="rooms-title">Rohangan Public</h3>
        <span className="rooms-count">{publicRooms.length} aktif</span>
      </div>

      <div className="rooms-scroll">
        {publicRooms.length > 0 ? (
          publicRooms.map((room) => {
            const isFull = room.playersCount >= room.maxPlayers;
            const isPlaying = room.phase !== 'lobby';
            const canJoin = !isFull && !isPlaying;

            return (
              <div
                key={room.code}
                className={`room-card ${!canJoin ? 'room-card-disabled' : ''}`}
                onClick={() => handleJoinRoom(room)}
              >
                <div className="room-card-left">
                  <span className="room-card-name">{room.name}</span>
                  <span className="room-card-players">{room.playersCount}/{room.maxPlayers} pamain</span>
                </div>
                <div className="room-card-right">
                  {isPlaying ? (
                    <span className="room-badge room-badge-playing">Bermain</span>
                  ) : isFull ? (
                    <span className="room-badge room-badge-full">Penuh</span>
                  ) : (
                    <button className="room-join-btn">Asup →</button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rooms-empty">
            <span className="rooms-empty-icon">🏚️</span>
            <p>Teu aya rohangan public</p>
            <p className="rooms-empty-hint">Jieun rohangan anyar heula!</p>
          </div>
        )}
      </div>
    </div>
  );
}
