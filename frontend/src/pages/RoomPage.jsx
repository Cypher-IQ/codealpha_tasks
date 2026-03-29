import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWebRTC from '../hooks/useWebRTC';
import useStore from '../store';
import VideoGrid from '../components/VideoGrid';
import Controls from '../components/Controls';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import ParticipantList from '../components/ParticipantList';
import { MessageSquare, LayoutDashboard, PenTool, Copy, Check, Users, Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const RoomPage = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Initialize WebRTC and Socket
  const { 
    localStream, peers, error, socket, connectionStatus,
    toggleMediaTrack, isScreenSharing, startScreenShare, stopScreenShare,
    toggleHand, sendReaction, reactions
  } = useWebRTC(roomId);

  const getStatusConfig = (status) => {
    switch(status) {
      case 'connected': return { color: 'bg-primary-500', textColor: 'text-primary-500', text: 'Connected', icon: <Wifi size={14} /> };
      case 'reconnecting': return { color: 'bg-yellow-500', textColor: 'text-yellow-500', text: 'Reconnecting...', icon: <Loader2 size={14} className="animate-spin" /> };
      case 'poor': return { color: 'bg-orange-500', textColor: 'text-orange-500', text: 'Poor Connection', icon: <AlertTriangle size={14} /> };
      case 'failed': return { color: 'bg-red-500', textColor: 'text-red-500', text: 'Disconnected', icon: <WifiOff size={14} /> };
      case 'connecting': default: return { color: 'bg-blue-500', textColor: 'text-blue-500', text: 'Connecting...', icon: <Loader2 size={14} className="animate-spin" /> };
    }
  };
  const statusConfig = getStatusConfig(connectionStatus);

  useEffect(() => {
    if (error) {
       // Just showing an alert or toast would be better in prod
       console.error(error);
    }
  }, [error]);

  const handleToggleAudio = (enabled) => toggleMediaTrack('audio', enabled);
  const handleToggleVideo = (enabled) => toggleMediaTrack('video', enabled);

  // Simple Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
        stopScreenShare();
    } else {
        await startScreenShare();
    }
  };

  return (
    <div className="h-screen w-screen bg-dark-900 overflow-hidden flex relative">
      
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-primary-500/10 blur-[130px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-accent-600/10 blur-[130px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Video Area */}
      <div className={`relative z-10 flex-1 flex flex-col transition-all duration-300 ${(isChatOpen || isParticipantListOpen) ? 'mr-80 sm:mr-0' : ''}`}>
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-dark-900/40 backdrop-blur-2xl absolute top-0 left-0 right-0 z-30 border-b border-white/5 shadow-sm">
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/')} className="text-dark-400 hover:text-white transition-colors bg-dark-800/50 p-2 rounded-xl hover:bg-dark-700">
              <LayoutDashboard size={20} />
            </button>
            <div className="h-5 w-px bg-dark-700"></div>
            <h2 className="font-display font-bold text-lg text-white tracking-wide flex items-center">
              Room: <span className="text-primary-400 font-mono ml-2 mr-3">{roomId}</span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-800/80 border border-white/5 text-xs font-medium ${statusConfig.textColor}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.color} ${['connecting', 'reconnecting'].includes(connectionStatus) ? 'animate-pulse' : ''}`}></div>
                {statusConfig.icon}
                <span className="hidden sm:inline">{statusConfig.text}</span>
              </div>
            </h2>
            <button 
              onClick={() => {
                 navigator.clipboard.writeText(window.location.href);
                 setIsCopied(true);
                 setTimeout(() => setIsCopied(false), 2000);
              }}
              className="p-1.5 ml-2 bg-dark-800/80 border border-white/5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm"
              title="Copy Invite Link"
            >
              {isCopied ? <Check size={16} className="text-primary-500" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={() => { setIsParticipantListOpen(!isParticipantListOpen); setIsChatOpen(false); setIsWhiteboardOpen(false); }}
                className={`p-2 rounded-lg transition-all ${isParticipantListOpen ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'}`}
                title="Participants"
             >
                 <Users size={20} />
             </button>
             <button 
                onClick={() => { setIsWhiteboardOpen(!isWhiteboardOpen); setIsChatOpen(false); setIsParticipantListOpen(false); }}
                className={`p-2 rounded-lg transition-all ${isWhiteboardOpen ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'}`}
                title="Whiteboard"
             >
                 <PenTool size={20} />
             </button>
             <button 
                onClick={() => { setIsChatOpen(!isChatOpen); setIsWhiteboardOpen(false); setIsParticipantListOpen(false); }}
                className={`p-2 rounded-lg transition-all ${isChatOpen ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'}`}
                title="Chat"
             >
                 <MessageSquare size={20} />
             </button>
          </div>
        </header>

        {/* Floating Reactions Overlay */}
        <div className="absolute bottom-32 left-8 md:left-24 z-20 pointer-events-none flex flex-col-reverse items-start gap-2">
           {reactions.map((reaction) => (
               <div 
                   key={reaction.id} 
                   className="bg-dark-800/80 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-white/10 text-2xl animate-float-up opacity-0 flex items-center gap-2"
                   style={{ animationDuration: '3s', animationFillMode: 'forwards' }}
               >
                   {/* We could find the username from participants here, but keeping it simple/lightweight for now based on socketId */}
                   {reaction.emoji}
               </div>
           ))}
        </div>

        {/* VideoGrid wraps reactions implicitly via z-index layer below */}
        <div className="flex-1 mt-16 pb-28 relative">
           {['connecting', 'reconnecting'].includes(connectionStatus) && (
              <div className="absolute inset-4 z-20 flex flex-col items-center justify-center bg-dark-900/60 backdrop-blur-md rounded-3xl border border-white/5 animate-fade-in shadow-2xl">
                 <div className="w-16 h-16 bg-dark-800/80 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10">
                    <Loader2 size={32} className={`${statusConfig.textColor} animate-spin`} />
                 </div>
                 <h3 className="text-xl font-display font-semibold text-white mb-2">{statusConfig.text}</h3>
                 <p className="text-dark-400 max-w-xs text-center text-sm">
                    {connectionStatus === 'connecting' ? 'Establishing secure connection...' : 'Network drop detected. Attempting to restore connection...'}
                 </p>
              </div>
           )}
           <VideoGrid localStream={localStream} peers={peers} isScreenSharing={isScreenSharing} />
        </div>

        {/* Floating Controls */}
        <Controls 
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          isScreenSharing={isScreenSharing}
          onToggleHand={toggleHand}
          onSendReaction={sendReaction}
        />
      </div>

      {/* Sidebars (Chat / Whiteboard / Participants Overlay) */}
      <Chat socket={socket} roomId={roomId} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <Whiteboard socket={socket} roomId={roomId} isOpen={isWhiteboardOpen} onClose={() => setIsWhiteboardOpen(false)} />
      <ParticipantList socket={socket} roomId={roomId} isOpen={isParticipantListOpen} onClose={() => setIsParticipantListOpen(false)} />
      
    </div>
  );
};

export default RoomPage;
