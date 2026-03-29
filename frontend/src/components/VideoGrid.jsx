import React, { useEffect, useRef } from 'react';
import useStore from '../store';
import { User } from 'lucide-react';

const VideoElement = ({ stream, isLocal, isScreenSharing }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative w-full h-full bg-dark-900 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/5 group transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] ${isLocal ? 'ring-1 ring-primary-500/50' : 'hover:border-white/20'}`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover transition-transform duration-500 ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-dark-800/50 backdrop-blur-md">
           <div className="w-20 h-20 rounded-full bg-dark-700/80 flex items-center justify-center animate-pulse border border-white/5 shadow-inner">
             <User size={40} className="text-dark-500" />
           </div>
        </div>
      )}
      
      {/* Label Overlay */}
      <div className="absolute bottom-4 left-4 bg-dark-900/40 backdrop-blur-xl px-4 py-2 rounded-xl text-sm font-semibold tracking-wide border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isLocal ? 'bg-primary-500 animate-pulse' : 'bg-gray-400'}`}></div>
        {isLocal ? (isScreenSharing ? 'You (Presenting)' : 'You') : 'Participant'}
      </div>

      {/* Presenting Indicator */}
      {isLocal && isScreenSharing && (
        <div className="absolute top-4 left-4 bg-primary-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg animate-pulse-slow border border-primary-400 z-10">
           You are presenting
        </div>
      )}
    </div>
  );
};

const VideoGrid = ({ localStream, peers, isScreenSharing }) => {
  const peerEntries = Object.entries(peers);
  const totalVideos = peerEntries.length + (localStream ? 1 : 0);

  // Dynamic grid mapping
  let gridClass = 'grid-cols-1 md:grid-cols-2';
  if (totalVideos === 1) gridClass = 'grid-cols-1 max-w-4xl mx-auto';
  else if (totalVideos === 2) gridClass = 'grid-cols-1 md:grid-cols-2';
  else if (totalVideos <= 4) gridClass = 'grid-cols-2 lg:grid-cols-2';
  else if (totalVideos <= 9) gridClass = 'grid-cols-3 lg:grid-cols-3';
  else gridClass = 'grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`w-full h-full p-4 grid gap-4 ${gridClass} animate-fade-in`}>
      {/* Local Video */}
      {localStream && (
        <div className={totalVideos === 1 ? 'h-[75vh]' : 'aspect-video'}>
           <VideoElement stream={localStream} isLocal={true} isScreenSharing={isScreenSharing} />
        </div>
      )}

      {/* Remote Videos */}
      {peerEntries.map(([socketId, stream]) => (
        <div key={socketId} className={totalVideos === 1 ? 'h-[75vh]' : 'aspect-video'}>
          <VideoElement stream={stream} isLocal={false} />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
