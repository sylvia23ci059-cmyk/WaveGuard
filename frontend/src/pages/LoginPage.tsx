import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, LogIn, Lock, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('waveguard123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Enter both username and password to continue.');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const success = login(username, password);
    if (!success) {
      setError('Invalid credentials. Use the demo admin account shown below.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-cyan-950/40">
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 p-6 text-white">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Secure access</p>
          <h1 className="mt-2 text-3xl font-bold">WaveGuard Access</h1>
          <p className="mt-2 text-sm text-cyan-50/90">
            Sign in to the Bengaluru flood intelligence control room.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Username</label>
            <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 focus-within:border-cyan-500">
              <User className="h-4 w-4 text-slate-400" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Password</label>
            <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 focus-within:border-cyan-500">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 transition hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn className="h-4 w-4" />
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="border-t border-slate-800 bg-slate-950/60 px-6 py-4 text-sm text-slate-300">
          <p className="font-medium text-slate-200">Demo credentials</p>
          <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
            <div>
              <span className="text-slate-400">Username:</span> <span className="font-semibold text-white">admin</span>
            </div>
            <div>
              <span className="text-slate-400">Password:</span> <span className="font-semibold text-white">waveguard123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
