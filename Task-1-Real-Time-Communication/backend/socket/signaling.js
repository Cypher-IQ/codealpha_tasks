const roomsState = {}; // Structure: { roomId: [{ socketId, userId, username, isHost, isAudioEnabled, isVideoEnabled }] }

module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join-room', (roomId, user) => {
            console.log(`User ${user?.username} (${socket.id}) joining room: ${roomId}`);
            socket.join(roomId);

            if (!roomsState[roomId]) {
                roomsState[roomId] = [];
            }

            const isHost = roomsState[roomId].length === 0;
            const newParticipant = {
                socketId: socket.id,
                userId: user?.id || `guest-${socket.id.substring(0,4)}`,
                username: user?.username || 'Guest',
                isHost,
                isAudioEnabled: true,
                isVideoEnabled: true,
                handRaised: false
            };

            roomsState[roomId].push(newParticipant);

            // Send full room state to the user who just joined
            socket.emit('room-state', roomsState[roomId]);

            // Notify everyone in the room EXCEPT the user joining about the new participant
            // This triggers the WebRTC 'createPeerOffer' on the other clients
            socket.to(roomId).emit('user-connected', newParticipant);

            socket.on('disconnect', () => {
                console.log(`User ${user?.username} disconnected from room ${roomId}`);
                
                if (roomsState[roomId]) {
                    // Remove user from state
                    const leftUser = roomsState[roomId].find(p => p.socketId === socket.id);
                    roomsState[roomId] = roomsState[roomId].filter(p => p.socketId !== socket.id);
                    
                    // Reassign host if the host left
                    if (leftUser?.isHost && roomsState[roomId].length > 0) {
                        roomsState[roomId][0].isHost = true;
                        io.to(roomId).emit('host-transferred', roomsState[roomId][0].socketId);
                    }
                    
                    if (roomsState[roomId].length === 0) {
                        delete roomsState[roomId]; // Cleanup empty rooms
                    }
                }

                socket.to(roomId).emit('user-disconnected', newParticipant.userId, socket.id);
            });
        });

        // WebRTC Signaling
        // Sender wants to initiate a peer connection
        socket.on('offer', (offer, roomId, toSocketId, fromUserId) => {
            socket.to(toSocketId).emit('offer', offer, socket.id, fromUserId);
        });

        // Receiver answers the offer
        socket.on('answer', (answer, roomId, toSocketId) => {
            socket.to(toSocketId).emit('answer', answer, socket.id);
        });

        // ICE Candidates exchange
        socket.on('ice-candidate', (candidate, roomId, toSocketId) => {
            socket.to(toSocketId).emit('ice-candidate', candidate, socket.id);
        });

        // Chat functionality
        socket.on('chat-message', (roomId, messageData) => {
            // Emits to everyone in the room including sender
            io.to(roomId).emit('chat-message', messageData); 
        });

        // Whiteboard drawing functionality
        socket.on('draw', (roomId, drawData) => {
            socket.to(roomId).emit('draw', drawData); // To everyone else
        });

        // Media toggles (mute/unmute audio/video)
        socket.on('toggle-media', (roomId, mediaType, isEnabled) => {
            if (roomsState[roomId]) {
                const p = roomsState[roomId].find(u => u.socketId === socket.id);
                if (p) {
                    if (mediaType === 'audio') p.isAudioEnabled = isEnabled;
                    if (mediaType === 'video') p.isVideoEnabled = isEnabled;
                }
            }
            // Broadcast to everyone including sender so state syncs globally easily
            io.to(roomId).emit('participant-updated', socket.id, mediaType, isEnabled);
        });

        // Interactive Features
        socket.on('toggle-hand', (roomId, isRaised) => {
            if (roomsState[roomId]) {
                const p = roomsState[roomId].find(u => u.socketId === socket.id);
                if (p) p.handRaised = isRaised;
            }
            io.to(roomId).emit('hand-toggled', socket.id, isRaised);
        });

        socket.on('send-reaction', (roomId, emoji) => {
            // Ephemeral event, no need to store in state
            io.to(roomId).emit('receive-reaction', socket.id, emoji);
        });

        // Host Controls
        socket.on('host-mute-user', (roomId, targetSocketId) => {
            const requester = roomsState[roomId]?.find(p => p.socketId === socket.id);
            if (requester?.isHost) {
                // Send specific event to target user to mute themselves
                io.to(targetSocketId).emit('force-mute-audio');
            }
        });

        socket.on('host-kick-user', (roomId, targetSocketId) => {
            const requester = roomsState[roomId]?.find(p => p.socketId === socket.id);
            if (requester?.isHost) {
                io.to(targetSocketId).emit('kicked-from-room');
            }
        });
    });
};
