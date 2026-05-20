import React, { useState } from 'react';
import { Eye, EyeOff, Zap, ArrowRight, Package, BarChart2, Users, Shield, Sun, Moon } from 'lucide-react';

const FEATURES = [
  { icon: Package, text: 'Real-time inventory management' },
  { icon: BarChart2, text: 'Smart analytics & AI insights' },
  { icon: Users, text: 'Multi-user roles & permissions' },
  { icon: Shield, text: 'Secure & offline-ready' },
];

export default function Signup({ onSignup, onSwitchToLogin, darkMode, setDarkMode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSignup({ name, email, password, role: 'Owner' });
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-col w-[55%] bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-2xl flex items-center justify-center shadow-glow">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">QuickBill</span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center relative z-10 mt-16">
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Start managing your store<br />
                <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                  like a pro.
                </span>
              </h2>
              <p className="mt-4 text-lg text-slate-300 leading-relaxed">
                Join thousands of store owners managing their inventory, bills, and customers efficiently.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.text} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-indigo-300" />
                    </div>
                    <span className="text-slate-300">{f.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-sm text-slate-300">Free forever for small businesses</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative">
        
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">QuickBill</span>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Create an account</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </button>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 animate-slideDown">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-11"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters long.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            By creating an account, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
