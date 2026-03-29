import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, LayoutTemplate } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.[Object.keys(err.response.data.errors[0])[0]] || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Animated background blobs for extra premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full space-y-8 p-10 rounded-3xl card relative z-10 animate-fade-in-up">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-primary-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <LayoutTemplate className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-surface-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-surface-500">
            Sign in to your workspace
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button type="submit" className="btn btn-primary w-full py-2.5 text-base shadow-lg shadow-primary-500/30">
              Sign in <LogIn className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-surface-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
