'use client';

import { useState, useEffect } from 'react';

export interface UserAccount {
  savings_balance?: number;
  wealth_balance?: number;
}

export interface UserInvestments {
  mutual_funds?: number;
  fixed_deposits?: number;
  gold_bonds?: number;
}

export interface User {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  tier?: string;
  memberSince?: string;
  accounts?: UserAccount;
  investments?: UserInvestments;
}

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export const DEMO_PROFILES: User[] = [
  {
    id: "usr_bh_001",
    username: "bharadwaj",
    fullName: "Bharadwaj",
    email: "bharadwaj@bankingai.com",
    tier: "Priority Client",
    memberSince: "2021",
    accounts: {
      savings_balance: 828456.50,
      wealth_balance: 200000.00
    },
    investments: {
      mutual_funds: 250000.00,
      fixed_deposits: 100000.00,
      gold_bonds: 62500.00
    }
  },
  {
    id: "usr_vk_002",
    username: "kohli",
    fullName: "Kohli",
    email: "kohli@bankingai.com",
    tier: "Premier Wealth Member",
    memberSince: "2018",
    accounts: {
      savings_balance: 1850000.00,
      wealth_balance: 750000.00
    },
    investments: {
      mutual_funds: 620000.00,
      fixed_deposits: 500000.00,
      gold_bonds: 410000.00
    }
  },
  {
    id: "usr_cr_003",
    username: "ronaldo",
    fullName: "Ronaldo",
    email: "ronaldo@bankingai.com",
    tier: "Centurion Global Member",
    memberSince: "2016",
    accounts: {
      savings_balance: 3200000.00,
      wealth_balance: 1400000.00
    },
    investments: {
      mutual_funds: 1200000.00,
      fixed_deposits: 850000.00,
      gold_bonds: 950000.00
    }
  }
];

export default function AuthModal({ 
  isOpen, 
  initialTab = 'login', 
  onClose, 
  onSuccess 
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  const handleQuickDemo = (profile: User) => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      onSuccess(profile, `demo_${profile.id}_${Date.now()}`);
      setIsLoading(false);
      onClose();
    }, 150);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt backend auth if running
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: identifier, password }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        onSuccess(data.user, data.token);
        onClose();
        return;
      }

      // Minimal fallback: if user types "bharadwaj" or any name, smoothly log in
      const matched = DEMO_PROFILES.find(
        p => p.username.toLowerCase() === identifier.toLowerCase() || 
             p.email.toLowerCase() === identifier.toLowerCase()
      );

      const loggedUser: User = matched || {
        id: `usr_${Date.now()}`,
        username: identifier.includes('@') ? identifier.split('@')[0] : identifier,
        fullName: identifier.includes('@') ? identifier.split('@')[0] : identifier,
        email: identifier.includes('@') ? identifier : `${identifier}@bankingai.com`,
        tier: "Standard Client",
        memberSince: "2026",
        accounts: {
          savings_balance: 750000.00,
          wealth_balance: 200000.00
        },
        investments: {
          mutual_funds: 250000.00,
          fixed_deposits: 100000.00,
          gold_bonds: 62500.00
        }
      };

      onSuccess(loggedUser, `token_${loggedUser.id}_${Date.now()}`);
      onClose();
    } catch {
      setError('Log in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      const username = email.split('@')[0];
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email: email.trim(),
          password
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        onSuccess(data.user, data.token);
        onClose();
        return;
      }

      // Instant local signup fallback
      const newUser: User = {
        id: `usr_${Date.now()}`,
        username,
        fullName: name.trim() || username,
        email: email.trim(),
        tier: "Standard Client",
        memberSince: "2026",
        accounts: {
          savings_balance: 500000.00,
          wealth_balance: 150000.00
        },
        investments: {
          mutual_funds: 100000.00,
          fixed_deposits: 50000.00,
          gold_bonds: 25000.00
        }
      };

      onSuccess(newUser, `token_${newUser.id}_${Date.now()}`);
      onClose();
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Minimal Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl text-slate-800 animate-in fade-in duration-150">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Minimal Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-serif font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-xs">
            B
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {tab === 'login' ? 'Log In' : 'Sign Up'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            BankingAI Account Access
          </p>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`py-1.5 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`py-1.5 rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* LOG IN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="bharadwaj or email"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-xs transition-colors disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Logging In...' : 'Log In'}
            </button>

            {/* Quick 1-click Demo helper */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleQuickDemo(DEMO_PROFILES[0])}
                className="text-xs text-amber-800 hover:text-amber-900 font-semibold underline underline-offset-2"
              >
                1-Click Demo: Continue as Bharadwaj →
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bharadwaj"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bharadwaj@example.com"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-xs transition-colors disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* Minimal Bottom Switch */}
        <div className="mt-5 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          {tab === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button 
                onClick={() => setTab('signup')}
                className="font-bold text-slate-900 hover:underline"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button 
                onClick={() => setTab('login')}
                className="font-bold text-slate-900 hover:underline"
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
