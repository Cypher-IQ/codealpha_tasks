import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Toaster } from 'react-hot-toast';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import BoardView from './components/board/BoardView';
import JoinProject from './components/project/JoinProject';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center shadow-inner">Loading...</div>;
  
  return user ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/project/:projectId/board/:boardId" element={<PrivateRoute><BoardView /></PrivateRoute>} />
      <Route path="/join/:projectId" element={<PrivateRoute><JoinProject /></PrivateRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="bottom-right" />
          <div className="min-h-screen font-sans text-surface-900 selection:bg-primary-200">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
