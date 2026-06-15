import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Save, Loader2, Shield, BarChart2, Calendar, Github } from 'lucide-react';
import { formatDate } from '../utils/helpers.js';
import GithubSync from '../components/GithubSync.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [nameForm, setNameForm]   = useState({ name: user?.name || '' });
  const [pwForm,   setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]           = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return toast.error('Name cannot be empty.');
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', { name: nameForm.name });
      updateUser({ name: res.data.user.name });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill all password fields.');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be 6+ characters.');
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match.');
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-container max-w-4xl">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Profile</h1>
              <p className="page-subtitle">Manage your account settings</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="glass-card p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-primary-500/30">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-black text-dark-900 dark:text-white">{user?.name}</h2>
                <p className="text-dark-400 mb-2">{user?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="badge-info capitalize flex items-center gap-1">
                    <Shield className="w-3 h-3" />{user?.role}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 rounded-full flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" />{user?.analysisCount || 0} analyses
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />Joined {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Name */}
            <form onSubmit={handleProfileSave} className="space-y-4">
              <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 border-b border-dark-200 dark:border-dark-700 pb-3 mb-4">Edit Profile</h3>
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="text" value={nameForm.name} onChange={e => setNameForm({ name: e.target.value })}
                    className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="email" value={user?.email} disabled className="input-field pl-10 opacity-60 cursor-not-allowed" />
                </div>
                <p className="text-xs text-dark-400 mt-1">Email cannot be changed.</p>
              </div>
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 border-b border-dark-200 dark:border-dark-700 pb-3 mb-6">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { label: 'Current Password', key: 'currentPassword' },
                { label: 'New Password',     key: 'newPassword' },
                { label: 'Confirm New Password', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input type="password" value={pwForm[key]}
                      onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                      className="input-field pl-10" placeholder="••••••••" />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={savingPw} className="btn-primary">
                {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </form>
          </div>
          {/* GitHub Sync */}
          <div className="glass-card p-8 mt-6">
            <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 border-b border-dark-200 dark:border-dark-700 pb-3 mb-6 flex items-center gap-2">
              <Github className="w-5 h-5" /> GitHub Integration
            </h3>
            <GithubSync />
          </div>
        </main>
      </div>
    </div>
  );
}
