import { useState, useEffect } from 'react';
import {
  Github, Star, GitFork, ExternalLink, RefreshCw,
  Unlink, CheckCircle, Loader2, AlertCircle, Globe, Users
} from 'lucide-react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5',
  Java: '#b07219', 'C++': '#f34b7d', Go: '#00add8', Rust: '#dea584',
  Ruby: '#701516', PHP: '#4f5d95', Swift: '#fa7343', Kotlin: '#7F52FF',
  Dart: '#00b4ab', CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051',
};

export default function GithubSync() {
  const [synced, setSynced]       = useState(false);
  const [profile, setProfile]     = useState(null);
  const [username, setUsername]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);

  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetching(true);
    try {
      const res = await api.get('/github/profile');
      if (res.data.synced) {
        setSynced(true);
        setProfile(res.data.data);
      }
    } catch { /* not synced */ }
    finally { setFetching(false); }
  };

  const syncGithub = async () => {
    if (!username.trim()) return toast.error('Enter your GitHub username');
    setLoading(true);
    try {
      const res = await api.post('/github/sync', { username: username.trim() });
      setSynced(true);
      setProfile(res.data.data);
      toast.success(`✅ GitHub synced! Found ${res.data.data.publicRepos} repos`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed. Check username and try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      await api.delete('/github/disconnect');
      setSynced(false);
      setProfile(null);
      setUsername('');
      toast.success('GitHub disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  if (fetching) {
    return (
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Loading GitHub status…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (synced && profile) {
    return (
      <div style={styles.card}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: '#1f2937', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Github size={22} color="#e2e8f0" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                @{profile.username}
                <CheckCircle size={14} color="#22c55e" />
              </div>
              {profile.name && <div style={{ fontSize: 13, color: '#64748b' }}>{profile.name}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchProfile}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={disconnect}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13, cursor: 'pointer' }}>
              <Unlink size={13} /> Disconnect
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Repositories', value: profile.publicRepos, icon: '📦' },
            { label: 'Followers',    value: profile.followers,   icon: '👥' },
            { label: 'Following',    value: profile.following,   icon: '➡️' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ flex: 1, minWidth: 90, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', marginTop: 4 }}>{value ?? 0}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#94a3b8', fontStyle: 'italic', border: '1px solid rgba(255,255,255,0.06)' }}>
            "{profile.bio}"
          </div>
        )}

        {/* Top Repos */}
        {profile.repos?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Top Repositories
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {profile.repos.slice(0, 6).map(repo => (
                <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer"
                  style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', flex: 1, wordBreak: 'break-word' }}>{repo.name}</span>
                    <ExternalLink size={12} color="#475569" style={{ flexShrink: 0, marginLeft: 8, marginTop: 2 }} />
                  </div>
                  {repo.description && (
                    <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#64748b', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {repo.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {repo.language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[repo.language] || '#64748b', display: 'inline-block' }} />
                        {repo.language}
                      </span>
                    )}
                    {repo.stars > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                        <Star size={11} /> {repo.stars}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not synced — show connect form
  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, background: '#1f2937', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Github size={24} color="#e2e8f0" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Connect GitHub</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Sync your repos and activity to your profile</p>
        </div>
      </div>

      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#94a3b8', display: 'flex', gap: 10 }}>
        <AlertCircle size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Enter your public GitHub username. Only public repositories will be synced.</span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 14 }}>@</span>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && syncGithub()}
            placeholder="your-github-username"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', padding: '10px 12px 10px 26px', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={syncGithub} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1f2937, #374151)', color: '#e2e8f0', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Github size={15} />}
          {loading ? 'Syncing…' : 'Connect'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  card: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
  },
};
