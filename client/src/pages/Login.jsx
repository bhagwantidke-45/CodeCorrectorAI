import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Code2, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-900">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-600 via-purple-700 to-dark-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CleanCoder AI</span>
        </Link>
        <div className="relative z-10">
          <blockquote className="text-2xl font-bold text-white leading-relaxed mb-6">
            "Write code faster, fix bugs smarter, ship with confidence."
          </blockquote>
          <div className="flex flex-wrap gap-3">
            {['AI-Powered', 'Instant Fixes', 'PDF Reports', '8 Languages'].map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-white text-sm font-medium backdrop-blur-sm">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">CleanCoder AI</span>
          </Link>

          <h1 className="text-3xl font-black text-dark-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-dark-500 dark:text-dark-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base mt-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Signing in...</> : <>Sign In<ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-dark-500 dark:text-dark-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Create one free</Link>
          </p>

          <div className="mt-6 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700">
            <p className="text-xs text-dark-500 dark:text-dark-400 text-center">
              💡 You can also <Link to="/analyze" className="text-primary-500 font-medium hover:underline">analyze code without an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
