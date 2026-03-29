import React, { useState } from 'react';
import useStore from '../store';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Settings, Hand, SmilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['👍', '👏', '😂', '🔥', '❤️', '🎉'];

const Controls = ({ onToggleAudio, onToggleVideo, onToggleScreenShare, isScreenSharing, onToggleHand, onSendReaction }) => {
  const { isAudioEnabled, isVideoEnabled, isHandRaised, setHandRaised, toggleAudio, toggleVideo } = useStore();
  const [showReactions, setShowReactions] = useState(false);
  const navigate = useNavigate();

  const handleAudioToggle = () => {
    toggleAudio();
    onToggleAudio(!isAudioEnabled);
  };

  const handleVideoToggle = () => {
    toggleVideo();
    onToggleVideo(!isVideoEnabled);
  };

  const handleLeave = () => {
    // In a real app, you'd confirm first
    navigate('/');
  };

  const handleHandToggle = () => {
      const newState = !isHandRaised;
      setHandRaised(newState);
      if (onToggleHand) onToggleHand(newState);
  };

  const handleReaction = (emoji) => {
      if (onSendReaction) onSendReaction(emoji);
      setShowReactions(false);
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-panel rounded-2xl px-6 py-4 flex items-center justify-center gap-4 sm:gap-6 animate-slide-up pb-5 shadow-2xl z-50">
      
      <button 
        onClick={handleAudioToggle} 
        className={isAudioEnabled ? 'btn-icon' : 'btn-icon-danger'}
        title={isAudioEnabled ? "Mute" : "Unmute"}
      >
        {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
      </button>

      <button 
        onClick={handleVideoToggle} 
        className={isVideoEnabled ? 'btn-icon' : 'btn-icon-danger'}
        title={isVideoEnabled ? "Stop Video" : "Start Video"}
      >
        {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
      </button>

      <div className="w-px h-10 bg-dark-600 mx-2 hidden sm:block"></div>

      <button 
        onClick={onToggleScreenShare} 
        className={isScreenSharing ? 'btn-icon-active' : 'btn-icon'}
        title="Share Screen"
      >
        <MonitorUp size={24} />
      </button>

      <div className="w-px h-10 bg-dark-600 mx-2 hidden sm:block"></div>

      <button 
        onClick={handleHandToggle} 
        className={isHandRaised ? 'btn-icon-active bg-accent-500/20 text-accent-400 border-accent-500/50 hover:bg-accent-500/30' : 'btn-icon hover:text-accent-400'}
        title={isHandRaised ? "Lower Hand" : "Raise Hand"}
      >
        <Hand size={24} className={isHandRaised ? 'fill-accent-500/50' : ''} />
      </button>

      <div className="relative">
          <button 
            onClick={() => setShowReactions(!showReactions)} 
            className={`btn-icon hover:text-yellow-400 transition-colors ${showReactions ? 'bg-dark-700' : ''}`}
            title="Reactions"
          >
            <SmilePlus size={24} />
          </button>
          
          {showReactions && (
             <div className="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-1 shadow-2xl animate-fade-in origin-bottom">
                 {EMOJIS.map(emoji => (
                     <button 
                         key={emoji}
                         onClick={() => handleReaction(emoji)}
                         className="p-2 text-2xl hover:bg-dark-700/50 rounded-xl hover:scale-125 transition-transform active:scale-95"
                     >
                        {emoji}
                     </button>
                 ))}
                 {/* Decorative triangle pointer */}
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-dark-800/95 border-b border-r border-white/10 transform rotate-45"></div>
             </div>
          )}
      </div>

      <div className="w-px h-10 bg-dark-600 mx-2 hidden sm:block"></div>

      {/* Settings / Extra Options */}
      <button className="btn-icon hidden sm:flex" title="Settings">
        <Settings size={22} />
      </button>

      {/* Leave Button */}
      <button 
        onClick={handleLeave} 
        className="px-6 py-3 bg-red-600 hover:bg-red-500 hover:shadow-lg shadow-red-500/20 text-white rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95 ml-2"
      >
        <PhoneOff size={20} />
        <span className="hidden sm:inline">Leave</span>
      </button>

    </div>
  );
};

export default Controls;
