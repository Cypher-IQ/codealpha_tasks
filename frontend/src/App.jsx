import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store';
import { Toaster } from 'react-hot-toast';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import RoomPage from './pages/RoomPage';

// Simple PrivateRoute wrapper
const PrivateRoute = ({ children }) => {
  const token = useStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-white relative">
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/room/:id" 
            element={
              <PrivateRoute>
                <RoomPage />
              </PrivateRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }} />
      </div>
    </Router>
  );
}

export default App;
