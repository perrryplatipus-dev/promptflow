import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SocketProvider } from './contexts/SocketContext';

// Layouts
import { PageLayout } from './layout/PageLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { PromptEditor } from './pages/PromptEditor';
import { LiveComparison } from './pages/LiveComparison';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { AdminLogin } from './pages/Auth/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Protected Workspace Dashboard Routes */}
              <Route element={<PageLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/compare" element={<PromptEditor />} />
                <Route path="/compare/live" element={<LiveComparison />} />
                <Route path="/history" element={<History />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Global toast notification system wrapper */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                },
              }}
            />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </SettingsProvider>
  );
};
export default App;
