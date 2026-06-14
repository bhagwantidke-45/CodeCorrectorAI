import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Zap, History, FileText, User,
  Shield, Code2, ChevronLeft, ChevronRight, FolderOpen
} from 'lucide-react';
import { useState } from 'react';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/analyze',   label: 'Analyzer',   icon: Zap },
  { to: '/history',   label: 'History',    icon: History },
  { to: '/reports',   label: 'Reports',    icon: FileText },
  { to: '/profile',   label: 'Profile',    icon: User },
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
        {LINKS.map(({ to, label, icon: Icon }) => (
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
