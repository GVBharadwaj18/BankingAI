'use client';

import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; username: string; email: string }, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError('All fields are required');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('All fields are required');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const body = mode === 'login' 
        ? { emailOrUsername: email, password }
        : { username, email, password };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }

      onSuccess(data.user, data.token);
      onClose();
      // Reset form
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Connection failed. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#040d1a]/95 p-8 shadow-glass-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center text-white font-bold text-lg mx-auto shadow-neon mb-3">
            A
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-white/50 mt-1">
            {mode === 'login' ? 'Access your priority elite banking panel' : 'Join ApexBank and access intelligent assets'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. priority_user"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-accent-neon focus:border-accent-neon transition-all"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
              {mode === 'login' ? 'Email or Username' : 'Email Address'}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? "username or email" : "user@apexbank.com"}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-accent-neon focus:border-accent-neon transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-accent-neon focus:border-accent-neon transition-all"
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-accent-neon focus:border-accent-neon transition-all"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-gradient-accent hover:shadow-neon text-dark-950 font-extrabold rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-dark-950/20 border-t-dark-950 rounded-full animate-spin"></span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-xs text-white/40 hover:text-accent-neon font-semibold transition-colors"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}
