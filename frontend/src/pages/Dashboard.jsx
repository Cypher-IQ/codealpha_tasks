import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { Video, Plus, Key, LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useStore();
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = 'http://localhost:5000';

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${baseUrl}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newRoomName || `${user.username}'s Room` })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomIdToJoin.trim()) return;
    navigate(`/room/${roomIdToJoin}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 md:p-10 relative overflow-hidden bg-dark-900">
      
      {/* Ambient Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[40vw] h-[40vw] bg-primary-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] bg-accent-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl mx-auto animate-fade-in relative z-10">
        
        <header className="flex justify-between items-center mb-16 glass-panel px-8 py-5 rounded-3xl backdrop-blur-xl border border-white/5">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-float">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Nexus Meet</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-bold text-sm text-primary-500">
                    {user?.username?.[0]?.toUpperCase()}
                 </div>
                 <span className="font-medium text-dark-600 hidden md:block">{user?.username}</span>
             </div>
             <button onClick={handleLogout} className="btn-outline text-sm gap-2">
               <LogOut size={16} /> Logout
             </button>
          </div>
        </header>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
            {error}
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-10 mt-12">
          
          {/* Create Room Card */}
          <div className="glass-panel p-10 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] group border border-white/10 hover:border-primary-500/30">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400 rounded-2xl flex items-center justify-center mb-8 border border-primary-500/20 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
              <Plus size={32} />
            </div>
            <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">New Meeting</h2>
            <p className="text-dark-600 mb-8 text-lg leading-relaxed">Create a secure, high-performance room and invite participants instantly.</p>
            
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                placeholder="Room Name (Optional)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="input-field mb-5 text-lg"
              />
              <button disabled={loading} type="submit" className="w-full btn py-4 text-lg animate-glow">
                {loading ? 'Initializing Interface...' : 'Start Meeting Now'}
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel p-10 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(139,92,246,0.15)] group border border-white/10 hover:border-accent-500/30">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-500/20 to-accent-600/20 text-accent-400 rounded-2xl flex items-center justify-center mb-8 border border-accent-500/20 group-hover:scale-110 group-hover:bg-accent-500 group-hover:text-white transition-all duration-300">
              <Key size={32} />
            </div>
            <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">Join Meeting</h2>
            <p className="text-dark-600 mb-6">Enter a room code or link to join an existing meeting.</p>
            
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                required
                placeholder="Enter Room Code (e.g., abc-123-xyz)"
                value={roomIdToJoin}
                onChange={(e) => setRoomIdToJoin(e.target.value)}
                className="input-field mb-4"
              />
              <button type="submit" className="w-full btn-outline py-3 text-lg hover:border-primary-500 hover:text-primary-400">
                Join Meeting
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
