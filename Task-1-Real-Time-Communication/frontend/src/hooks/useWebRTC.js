import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import useStore from '../store';

import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
const useWebRTC = (roomId) => {
  const navigate = useNavigate();
  const { user, setParticipants, addParticipant, removeParticipant, updateParticipant, transferHost, setAudio } = useStore();
  const [peers, setPeers] = useState({}); // { socketId: MediaStream }
  const [localStream, setLocalStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [reactions, setReactions] = useState([]); // Buffer for ephemeral floating emojis
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  
  const socketRef = useRef();
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef();
  const screenStreamRef = useRef(null);

  const connectToSocket = useCallback(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setConnectionStatus('connected');
      toast.success('Connected', { id: 'conn-status' });
      // Pass the full user object to backend for participant tracking
      socketRef.current.emit('join-room', roomId, { id: user?.id, username: user?.username });
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected', reason);
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
         setConnectionStatus('failed');
      } else {
         setConnectionStatus('reconnecting');
         toast.loading('Reconnecting...', { id: 'conn-status' });
      }
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connect_error', err);
      setConnectionStatus('failed');
      toast.error('Connection failed.', { id: 'conn-status' });
    });

    socketRef.current.on('room-state', (participants) => {
       setParticipants(participants);
    });

    socketRef.current.on('user-connected', (participant) => {
      console.log(`User connected: ${participant.userId} (${participant.socketId})`);
      addParticipant(participant);
      createPeerOffer(participant.socketId, participant.userId);
    });

    socketRef.current.on('offer', async (offer, fromSocketId, fromUserId) => {
      console.log('Received offer from', fromSocketId);
      const peer = createPeerConnection(fromSocketId, fromUserId);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(new RTCSessionDescription(answer));
      socketRef.current.emit('answer', answer, roomId, fromSocketId);
    });

    socketRef.current.on('answer', async (answer, fromSocketId) => {
      console.log('Received answer from', fromSocketId);
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketRef.current.on('ice-candidate', async (candidate, fromSocketId) => {
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });
    socketRef.current.on('user-disconnected', (userId, socketId) => {
      console.log(`User disconnected: ${userId} (${socketId})`);
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setPeers((prevPeers) => {
        const newPeers = { ...prevPeers };
        delete newPeers[socketId];
        return newPeers;
      });
      removeParticipant(socketId);
    });

    socketRef.current.on('participant-updated', (socketId, mediaType, isEnabled) => {
       updateParticipant(socketId, {
          [mediaType === 'audio' ? 'isAudioEnabled' : 'isVideoEnabled']: isEnabled
       });
    });

    socketRef.current.on('host-transferred', (socketId) => {
       transferHost(socketId);
    });

    // Interactive Features
    socketRef.current.on('hand-toggled', (socketId, isRaised) => {
       updateParticipant(socketId, { handRaised: isRaised });
    });

    socketRef.current.on('receive-reaction', (socketId, emoji) => {
       const id = Date.now() + Math.random();
       setReactions((prev) => [...prev, { id, emoji, socketId }]);
       // Auto-remove reaction after animation completes (e.g., 3s)
       setTimeout(() => {
          setReactions((prev) => prev.filter(r => r.id !== id));
       }, 3000);
    });

    // Host Actions triggers
    socketRef.current.on('force-mute-audio', () => {
       // Host requested this user to mute
       if (localStreamRef.current) {
         localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
         setAudio(false);
         socketRef.current.emit('toggle-media', roomId, 'audio', false);
       }
    });

    socketRef.current.on('kicked-from-room', () => {
       alert("You have been removed from the room by the host.");
       navigate('/');
    });

  }, [roomId, user, navigate]);

  const createPeerConnection = (targetSocketId, targetUserId) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream tracks to peer
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    } else {
      console.warn("Local stream is null when creating peer connection. Others won't hear/see you yet.");
    }

    peer.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', peer.iceConnectionState);
      if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
         setConnectionStatus('poor');
         toast.error('Poor connection detected', { id: 'webrtc-status' });
      } else if (peer.iceConnectionState === 'connected' || peer.iceConnectionState === 'completed') {
         if (socketRef.current?.connected) setConnectionStatus('connected');
         toast.dismiss('webrtc-status');
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', event.candidate, roomId, targetSocketId);
      }
    };

    peer.ontrack = (event) => {
      console.log('Received remote track', event.streams[0]);
      setPeers((prevPeers) => ({
        ...prevPeers,
        [targetSocketId]: event.streams[0],
      }));
    };

    peersRef.current[targetSocketId] = peer;
    return peer;
  };

  const createPeerOffer = async (targetSocketId, targetUserId) => {
    const peer = createPeerConnection(targetSocketId, targetUserId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(offer));
    socketRef.current.emit('offer', offer, roomId, targetSocketId, user?.id || 'guest');
  };

  useEffect(() => {
    // 1. Get User Media first
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // 2. Connect to Socket and initiate signaling ONLY AFTER getting media
        connectToSocket();
      } catch (err) {
        console.error('Error accessing media devices.', err);
        setError('Could not access Camera/Microphone.');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
           toast.error('Camera/Microphone permission denied.', { duration: 5000 });
        } else {
           toast.error('Could not access Camera/Microphone.', { duration: 5000 });
        }
        // Still connect to socket even if no media, as a viewer
        connectToSocket();
      }
    };

    getMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peersRef.current).forEach(peer => peer.close());
    };
  }, [connectToSocket]);

  const toggleMediaTrack = (kind, enabled) => {
    // We only toggle the original camera/mic stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
         if (track.kind === kind) {
            track.enabled = enabled;
         }
      });
      // Notify backend to update participant state
      socketRef.current?.emit('toggle-media', roomId, kind, enabled);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      
      screenStreamRef.current = screenStream;
      
      // Automatically stop sharing if user clicks the browser's native "Stop Sharing" button
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // Replace the video track for all active peer connections without renegotiating
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });
      
      // Create a composite local stream for the UI: screen video + original mic audio
      const uiStream = new MediaStream([screenTrack]);
      if (localStreamRef.current) {
         const audioTrack = localStreamRef.current.getAudioTracks()[0];
         if (audioTrack) uiStream.addTrack(audioTrack);
      }
      
      // Render the screen stream locally
      setLocalStream(uiStream);
      setIsScreenSharing(true);
      
      return true;
    } catch (err) {
      console.error("Error starting screen share", err);
      return false;
    }
  };

  const stopScreenShare = () => {
    if (!screenStreamRef.current) return;

    // Properly stop the screen sharing tracks to remove the browser UI indicator
    screenStreamRef.current.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;

    // Get the original camera video track
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    
    // Replace the track in all peer connections back to the camera
    Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        // Only replace if cameraTrack exists (user has given permission)
        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack);
        }
    });

    // Revert the local UI to displaying the camera feed
    setLocalStream(localStreamRef.current);
    setIsScreenSharing(false);
  };

  const toggleHand = (isRaised) => {
     socketRef.current?.emit('toggle-hand', roomId, isRaised);
  };

  const sendReaction = (emoji) => {
     socketRef.current?.emit('send-reaction', roomId, emoji);
  };

  return { 
    localStream, peers, error, socket: socketRef.current, connectionStatus,
    toggleMediaTrack, isScreenSharing, startScreenShare, stopScreenShare,
    reactions, toggleHand, sendReaction 
  };
};

export default useWebRTC;
