import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import {
  Code2, Zap, Shield, Download, History, GitBranch,
  ArrowRight, Check, Star, ChevronRight, Sparkles, Brain, Lock
} from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Detection',  desc: 'Google Gemini analyzes syntax errors, logical mistakes, and runtime issues instantly.', color: 'from-purple-500 to-primary-500' },
  { icon: Zap, title: 'Instant Corrections',      desc: 'Get fully corrected, optimized code in seconds with detailed explanations for every fix.', color: 'from-yellow-500 to-orange-500' },
  { icon: Shield, title: 'Code Quality Score',   desc: 'Receive a 0-100 quality score with time/space complexity analysis for every submission.', color: 'from-green-500 to-teal-500' },
  { icon: GitBranch, title: 'Diff Comparison',   desc: 'Side-by-side view highlights exactly what changed between original and corrected code.', color: 'from-blue-500 to-cyan-500' },
  { icon: Download, title: 'PDF Reports',         desc: 'Download professional PDF reports containing analysis, errors, and corrected code.', color: 'from-pink-500 to-rose-500' },
  { icon: History, title: 'Analysis History',     desc: 'Save, search, and re-analyze all your past submissions with full history tracking.', color: 'from-indigo-500 to-purple-500' },
];

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'Go', 'PHP'];

const STEPS = [
  { n: '01', title: 'Paste or Upload Code', desc: 'Use the Monaco editor or drag-and-drop a file' },
  { n: '02', title: 'Select Language',       desc: 'Choose from 8 supported languages' },
  { n: '03', title: 'Click Analyze',         desc: 'AI detects errors and generates corrections' },
  { n: '04', title: 'Download & Learn',      desc: 'Get the corrected code and understand every fix' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      <Navbar />

      {/* Hero */}
      <section className="relative hero-gradient overflow-hidden pt-20 pb-32">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-semibold animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Powered by Google Gemini AI
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center max-w-4xl mx-auto mb-10 animate-slide-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-dark-900 dark:text-white leading-tight">
              Fix Your Code with
              <span className="block gradient-text mt-2">AI Precision</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-dark-500 dark:text-dark-300 max-w-2xl mx-auto leading-relaxed">
              CleanCoder AI detects bugs, explains mistakes in plain English, generates corrected code, and analyzes complexity — all in seconds.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Link to="/analyze" className="btn-primary text-lg px-8 py-4 shadow-2xl shadow-primary-500/30 animated-border">
              <Zap className="w-5 h-5" />
              Analyze Code Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn-secondary text-lg px-8 py-4">
                <Lock className="w-5 h-5" />
                Create Free Account
              </Link>
            )}
          </div>

          {/* Language Pills */}
          <div className="flex flex-wrap gap-2 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {LANGUAGES.map(lang => (
              <span key={lang} className="px-4 py-1.5 rounded-full bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 text-sm font-medium text-dark-600 dark:text-dark-300 hover:border-primary-400 hover:text-primary-500 transition-all cursor-default">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-dark-50 dark:bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-dark-900 dark:text-white mb-4">Everything You Need</h2>
            <p className="text-dark-500 dark:text-dark-400 text-lg max-w-xl mx-auto">A complete AI code quality platform from detection to correction</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title} className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 mb-2">{title}</h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-dark-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-dark-500 dark:text-dark-400 text-lg">Four simple steps to cleaner, better code</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-300 via-purple-300 to-pink-300 dark:from-primary-700 dark:via-purple-700 dark:to-pink-700" />
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} className="flex flex-col items-center text-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-xl shadow-primary-500/30">
                  <span className="text-white font-black text-lg">{n}</span>
                </div>
                <div>
                  <h3 className="font-bold text-dark-800 dark:text-dark-100 mb-1">{title}</h3>
                  <p className="text-sm text-dark-500 dark:text-dark-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 w-40 h-40 rounded-full border-4 border-white" />
          <div className="absolute bottom-5 right-20 w-64 h-64 rounded-full border-4 border-white" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-4xl font-black text-white mb-4">Ready to Write Better Code?</h2>
          <p className="text-primary-100 text-lg mb-10">Join thousands of developers improving their code quality with AI</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analyze" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
              <Zap className="w-5 h-5" />Start Analyzing — It's Free
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/30 hover:bg-white/20 transition-all">
                <ArrowRight className="w-5 h-5" />Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-dark-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Code2 className="w-5 h-5 text-primary-400" />
          <span className="text-white font-bold">CleanCoder AI</span>
        </div>
        <p className="text-dark-400 text-sm">© {new Date().getFullYear()} CleanCoder AI. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
}
