import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Zap, History, FileText, User,
  Shield, Code2, ChevronLeft, ChevronRight,
  Target, Trophy, BookOpen, Github
} from 'lucide-react';
import { useState } from 'react';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/analyze',   label: 'Analyzer',   icon: Zap },
  { to: '/history',   label: 'History',    icon: History },
  { to: '/reports',   label: 'Reports',    icon: FileText },
];

const PRACTICE_LINKS = [
  { to: '/practice',  label: 'Practice',     icon: Target },
  { to: '/contests',  label: 'Contests',     icon: Trophy },
  { to: '/learn',     label: 'Learning Path', icon: BookOpen },
];

const USER_LINKS = [
  { to: '/profile',   label: 'Profile',     icon: User },
];

export default function Sidebar() {
  const { user, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex flex-col h-full ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 border-r border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-200 dark:border-dark-700">
        <div className="w-9 h-9 min-w-[36px] bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold gradient-text leading-tight">CleanCoder AI</p>
            <p className="text-xs text-dark-400 truncate max-w-[140px]">{user?.email}</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {/* Main section */}
        {!collapsed && (
          <p className="text-xs text-dark-400 font-semibold uppercase tracking-widest px-3 mb-2">Main</p>
        )}
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `nav-link group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Practice section */}
        {!collapsed && (
          <p className="text-xs text-dark-400 font-semibold uppercase tracking-widest px-3 mt-4 mb-2">Practice</p>
        )}
        {collapsed && <div className="my-2 border-t border-dark-200 dark:border-dark-700" />}
        {PRACTICE_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `nav-link group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* User section */}
        {!collapsed && (
          <p className="text-xs text-dark-400 font-semibold uppercase tracking-widest px-3 mt-4 mb-2">Account</p>
        )}
        {collapsed && <div className="my-2 border-t border-dark-200 dark:border-dark-700" />}
        {USER_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `nav-link group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink to="/admin"
            className={({ isActive }) =>
              `nav-link group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''} mt-2`
            }>
            <Shield className="w-5 h-5 flex-shrink-0 text-purple-500" />
            {!collapsed && <span className="text-purple-500">Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* Streak & XP Mini Card */}
      {!collapsed && (
        <div className="mx-2 mb-2 p-3 rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔥</span>
              <span className="text-xs font-bold text-dark-700 dark:text-dark-200">
                {user?.challengeStreak || user?.streak || 0} day streak
              </span>
            </div>
            <span className="text-xs font-bold text-yellow-500">Lvl {user?.level || 1}</span>
          </div>
          <div className="w-full h-1.5 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((user?.xp || 0) % 100))}%` }}
            />
          </div>
          <p className="text-xs text-dark-400 mt-1">{user?.xp || 0} XP total</p>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="px-2 py-4 border-t border-dark-200 dark:border-dark-700">
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-all duration-200">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-sm">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
