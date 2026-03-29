import { create } from 'zustand';

const useStore = create((set) => ({
    // Auth State
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    login: (user, token) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        set({ user, token });
    },
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },

    // Room State
    currentRoom: null,
    setRoom: (room) => set({ currentRoom: room }),
    clearRoom: () => set({ currentRoom: null }),

    // Media State
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isHandRaised: false,
    toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
    toggleVideo: () => set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
    setAudio: (enabled) => set({ isAudioEnabled: enabled }),
    setScreenSharing: (status) => set({ isScreenSharing: status }),
    setHandRaised: (status) => set({ isHandRaised: status }),

    // Participant State
    participants: [],
    setParticipants: (participants) => set({ participants }),
    addParticipant: (participant) => set((state) => ({ 
        participants: state.participants.some(p => p.socketId === participant.socketId) 
            ? state.participants 
            : [...state.participants, participant] 
    })),
    removeParticipant: (socketId) => set((state) => ({ 
        participants: state.participants.filter(p => p.socketId !== socketId) 
    })),
    updateParticipant: (socketId, updates) => set((state) => ({
        participants: state.participants.map(p => p.socketId === socketId ? { ...p, ...updates } : p)
    })),
    transferHost: (socketId) => set((state) => ({
        participants: state.participants.map(p => ({
            ...p,
            isHost: p.socketId === socketId
        }))
    }))
}));

export default useStore;
