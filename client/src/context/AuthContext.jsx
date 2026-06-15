import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);

  // Fetch profile on mount / token change
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('cc_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('cc_token', t);
    setToken(t);
    setUser(u);
    toast.success(`Welcome back, ${u.name}!`);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('cc_token', t);
    setToken(t);
    setUser(u);
    toast.success('Account created successfully!');
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout and clear state anyway
    } finally {
      localStorage.removeItem('cc_token');
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully.');
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
