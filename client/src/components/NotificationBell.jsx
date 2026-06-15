import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, CheckCheck, Trash2, AlertCircle } from 'lucide-react';
import api from '../utils/api.js';

const TYPE_COLORS = {
  badge_earned:      'from-yellow-500 to-amber-500',
  streak_milestone:  'from-orange-500 to-red-500',
  challenge_solved:  'from-green-500 to-emerald-500',
  contest_started:   'from-blue-500 to-cyan-500',
  contest_ended:     'from-purple-500 to-pink-500',
  xp_gained:         'from-primary-500 to-indigo-500',
  level_up:          'from-pink-500 to-rose-500',
  daily_challenge:   'from-teal-500 to-green-500',
  system:            'from-slate-500 to-slate-600',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen]         = useState(false);
  const [notifs, setNotifs]     = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const panelRef                = useRef(null);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleOpen = () => {
    setOpen(o => !o);
    if (!open) fetchNotifs();
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifs(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs(n => n.map(x => x._id === id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch { /* ignore */ }
  };

  const deleteOne = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(n => n.filter(x => x._id !== id));
      setUnread(u => {
        const wasUnread = notifs.find(x => x._id === id && !x.read);
        return wasUnread ? Math.max(0, u - 1) : u;
      });
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={toggleOpen}
        className="relative p-2.5 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-all duration-200 text-dark-600 dark:text-dark-300"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-700 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden animate-fade-in"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-bold text-dark-800 dark:text-dark-100">Notifications</h3>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-700 transition-all">
                <X className="w-4 h-4 text-dark-400" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {loading && notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-dark-400">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm">Loading…</p>
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-dark-400">
                <Bell className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-dark-300 mt-1">Solve challenges to earn badges!</p>
              </div>
            ) : (
              <ul>
                {notifs.map((n) => (
                  <li
                    key={n._id}
                    onClick={() => !n.read && markOne(n._id)}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-dark-100 dark:border-dark-800 last:border-0 cursor-pointer transition-all duration-200 ${
                      n.read
                        ? 'bg-white dark:bg-dark-900'
                        : 'bg-primary-50/50 dark:bg-primary-950/20 hover:bg-primary-50 dark:hover:bg-primary-950/30'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-br ${TYPE_COLORS[n.type] || TYPE_COLORS.system} flex items-center justify-center text-lg shadow`}>
                      {n.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-snug ${n.read ? 'text-dark-600 dark:text-dark-300' : 'text-dark-800 dark:text-dark-100'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                          )}
                          <button
                            onClick={(e) => deleteOne(n._id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-red-400 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-dark-300 dark:text-dark-600 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
              <p className="text-xs text-center text-dark-400">Notifications auto-delete after 30 days</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
