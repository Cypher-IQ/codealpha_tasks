import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import { Video, Lock, User, ArrowRight } from 'lucide-react';

const AuthPage = ({ mode }) => {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const setAuth = useStore(state => state.login);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const baseUrl = 'http://localhost:5000'; // Make this env driven in prod
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuth(data.user, data.token);
      navigate('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-dark-900">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-500/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-accent-600/20 blur-[130px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md animate-slide-up z-10 relative">
        <div className="glass-panel p-10 rounded-3xl relative overflow-hidden backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-primary-400 to-accent-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-6 transform rotate-3 animate-float">
              <Video className="w-10 h-10 text-white -rotate-3" />
            </div>
            <h2 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500 mb-2">
              {isLogin ? 'Welcome Back' : 'Join Nexus'}
            </h2>
            <p className="text-dark-600 mt-2 text-center">
              {isLogin ? 'Sign in to access your meetings' : 'Create an account to start collaborating'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-600">
                <User size={20} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="input-field pl-12"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-600">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field pl-12"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn py-3 text-lg mt-4 group"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-dark-600">
            {isLogin ? (
              <p>Don't have an account? <a href="/signup" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">Sign up</a></p>
            ) : (
              <p>Already have an account? <a href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">Log in</a></p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
