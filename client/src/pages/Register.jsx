import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Code2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const PERKS = ['Free AI code analysis', 'Save unlimited history', 'Download PDF reports', 'Track code quality over time'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-900">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-purple-600 via-primary-700 to-dark-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CleanCoder AI</span>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-6">Start writing better code today.</h2>
          <div className="space-y-3">
            {PERKS.map(perk => (
              <div key={perk} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 rounded-full bg-green-400/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-300" />
                </div>
                <span className="text-sm font-medium">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">CleanCoder AI</span>
          </Link>

          <h1 className="text-3xl font-black text-dark-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-dark-500 dark:text-dark-400 mb-8">Free forever — no credit card required</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="text" placeholder="John Doe" className="input-field pl-10" {...field('name')} />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="email" placeholder="you@example.com" className="input-field pl-10" {...field('email')} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" className="input-field pl-10 pr-10" {...field('password')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="password" placeholder="Repeat password" className="input-field pl-10" {...field('confirm')} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base mt-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Creating account...</> : <>Create Account<ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-dark-500 dark:text-dark-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
