import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

import Home         from './pages/Home.jsx';
import Login        from './pages/Login.jsx';
import Register     from './pages/Register.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Analyzer     from './pages/Analyzer.jsx';
import History      from './pages/History.jsx';
import Reports      from './pages/Reports.jsx';
import Profile      from './pages/Profile.jsx';
import AdminPanel   from './pages/AdminPanel.jsx';
import SharedAnalysis from './pages/SharedAnalysis.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
              success: { style: { background: '#22c55e', color: '#fff' } },
              error:   { style: { background: '#ef4444', color: '#fff' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/"            element={<Home />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />
            <Route path="/analyze"     element={<Analyzer />} />
            <Route path="/share/:slug" element={<SharedAnalysis />} />

            {/* Protected — registered users */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/reports"   element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin only */}
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
