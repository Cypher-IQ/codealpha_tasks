import React from 'react';
import useStore from '../store';
import { X, Mic, MicOff, Video, VideoOff, Shield, ShieldOff, MoreVertical, Hand } from 'lucide-react';

const ParticipantList = ({ socket, roomId, isOpen, onClose }) => {
  const { participants, user } = useStore();

  const currentUserParticipant = participants.find(p => p.socketId === socket?.id);
  const isMeHost = currentUserParticipant?.isHost;

  const handleMuteUser = (targetSocketId) => {
    socket?.emit('host-mute-user', roomId, targetSocketId);
  };

  const handleKickUser = (targetSocketId) => {
    socket?.emit('host-kick-user', roomId, targetSocketId);
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-dark-900/95 backdrop-blur-2xl border-l border-white/5 flex flex-col absolute right-0 top-0 z-40 transform transition-transform animate-slide-left shadow-2xl">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
        <h3 className="font-display font-semibold text-white flex items-center gap-2">
          Participants 
          <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-0.5 rounded-full">
            {participants.length}
          </span>
        </h3>
        <button onClick={onClose} className="p-2 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800">
          <X size={20} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {participants.map((p) => {
          const isMe = p.socketId === socket?.id;

          return (
            <div key={p.socketId} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isMe ? 'bg-primary-900/10 border-primary-500/20' : 'bg-dark-800/50 border-white/5 hover:bg-dark-800'}`}>
              
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center font-bold text-dark-300 text-sm shadow-inner border border-white/5 shrink-0 relative">
                  {p.username.charAt(0).toUpperCase()}
                  {p.isHost && (
                    <div className="absolute -bottom-1 -right-1 bg-primary-600 rounded-full p-0.5 border border-dark-900">
                      <Shield size={10} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-white truncate flex items-center gap-2">
                    {p.username}
                    {isMe && <span className="text-[10px] text-dark-400 font-normal bg-dark-700 px-1.5 py-0.5 rounded-md">You</span>}
                    {p.handRaised && <Hand size={14} className="text-accent-400 fill-accent-400/50" />}
                  </span>
                  <span className="text-xs text-dark-500 truncate">
                    {p.isHost ? 'Host' : 'Participant'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {/* Media Indicators */}
                <div className={`p-1.5 rounded-md ${p.isAudioEnabled ? 'bg-dark-700/50 text-dark-300' : 'bg-red-500/10 text-red-400'}`}>
                  {p.isAudioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                </div>
                <div className={`p-1.5 rounded-md ${p.isVideoEnabled ? 'bg-dark-700/50 text-dark-300' : 'bg-red-500/10 text-red-400'}`}>
                  {p.isVideoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                </div>

                {/* Host Controls Dropdown/Actions */}
                {isMeHost && !isMe && (
                   <div className="relative group/menu">
                      <button className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-md transition-colors ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreVertical size={16} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-32 bg-dark-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 overflow-hidden transform origin-top-right scale-95 group-hover/menu:scale-100">
                        <button 
                          onClick={() => handleMuteUser(p.socketId)}
                          className="w-full text-left px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <MicOff size={14} /> Mute Audio
                        </button>
                        <button 
                          onClick={() => handleKickUser(p.socketId)}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-white/5"
                        >
                          <ShieldOff size={14} /> Remove
                        </button>
                      </div>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantList;
