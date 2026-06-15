import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Code2, Sun, Moon, Menu, X, LogOut, User, LayoutDashboard,
  History, FileText, Shield, Zap
} from 'lucide-react';
import StreakBadge from './StreakBadge.jsx';
import NotificationBell from './NotificationBell.jsx';

const NAV_LINKS = [
  { to: '/analyze',   label: 'Analyzer',  icon: Zap },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
  { to: '/history',   label: 'History',   icon: History, auth: true },
  { to: '/reports',   label: 'Reports',   icon: FileText, auth: true },
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 border-b border-dark-200/50 dark:border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary-500/40 transition-all duration-300 group-hover:scale-110">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">CleanCoder AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.filter(l => !l.auth || isAuthenticated).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400'
                    : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-primary-500'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                    : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800'
                }`}>
                <Shield className="w-4 h-4" />Admin
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-all duration-200 text-dark-600 dark:text-dark-300">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell — authenticated only */}
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <StreakBadge streak={user?.streak || 0} badges={user?.badges || []} compact={true} />
                <Link to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-dark-700 dark:text-dark-200">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout}
                  className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setOpen(!open)}
              className="md:hidden p-2.5 rounded-xl bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-4 py-4 space-y-2 animate-slide-up">
          {NAV_LINKS.filter(l => !l.auth || isAuthenticated).map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                isActive(to) ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-600' : 'text-dark-600 dark:text-dark-300'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-purple-600">
              <Shield className="w-4 h-4" />Admin Panel
            </Link>
          )}
          <div className="border-t border-dark-200 dark:border-dark-700 pt-3 mt-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-4 py-2 flex justify-between items-center border border-dark-100 dark:border-dark-800 rounded-xl bg-dark-50/50 dark:bg-dark-800/50">
                  <span className="text-xs font-semibold text-dark-500 dark:text-dark-400">Achievements</span>
                  <StreakBadge streak={user?.streak || 0} badges={user?.badges || []} compact={true} />
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary text-sm flex-1 justify-center">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-sm flex-1 justify-center">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
