'use client';

import { useState, useEffect } from 'react';
import ChatDock from '@/components/ChatDock';
import AuthModal, { DEMO_PROFILES, User } from '@/components/AuthModal';

interface Transaction {
  id: string;
  name: string;
  date: string;
  account: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  status: 'Settled' | 'Processing';
  reference: string;
  details?: {
    counterparty?: string;
    cashback?: string;
    taxStatus?: string;
  };
}

const maskEmail = (email?: string): string => {
  if (!email) return '';
  if (email.endsWith('@bankingai.com')) return email;
  const [local, domain] = email.split('@');
  if (!domain) return '•••••@bankingai.com';
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_01",
    name: "Amazon Online Purchase",
    date: "July 18, 2026",
    account: "Card • 9823",
    amount: -7499,
    type: "debit",
    category: "Shopping & Retail",
    status: "Settled",
    reference: "TXN-AMZN-9874102",
    details: {
      counterparty: "Amazon Retail India Ltd",
      cashback: "₹375 (5% Centurion Cashback)",
      taxStatus: "GST Included (18%)"
    }
  },
  {
    id: "txn_02",
    name: "Monthly Corporate Salary",
    date: "July 16, 2026",
    account: "Account • 4501",
    amount: 291500,
    type: "credit",
    category: "Income / Salary",
    status: "Settled",
    reference: "TXN-PAYR-1029481",
    details: {
      counterparty: "Apex Technologies Corp",
      cashback: "N/A",
      taxStatus: "Tax Withheld at Source"
    }
  },
  {
    id: "txn_03",
    name: "Freshmart Grocery Store",
    date: "July 14, 2026",
    account: "Card • 8847",
    amount: -10620,
    type: "debit",
    category: "Groceries & Household",
    status: "Settled",
    reference: "TXN-FRSH-4820194",
    details: {
      counterparty: "Freshmart Grocers",
      cashback: "₹212 (2% Cashback)",
      taxStatus: "GST Paid"
    }
  },
  {
    id: "txn_04",
    name: "Sovereign Gold Bond Tranche XIV",
    date: "July 10, 2026",
    account: "Account • 9102",
    amount: -62500,
    type: "debit",
    category: "Investments & Treasury",
    status: "Settled",
    reference: "TXN-SGB-8837192",
    details: {
      counterparty: "Reserve Bank of India",
      cashback: "2.5% Annual Sovereign Coupon",
      taxStatus: "Exempt on Maturity"
    }
  },
  {
    id: "txn_05",
    name: "Dividends - Balanced Growth Fund",
    date: "July 05, 2026",
    account: "Account • 4501",
    amount: 18450,
    type: "credit",
    category: "Dividends & Yield",
    status: "Settled",
    reference: "TXN-DIV-0029481",
    details: {
      counterparty: "BankingAI Asset Management",
      cashback: "N/A",
      taxStatus: "Qualified Dividend Yield"
    }
  }
];

const CARDS_DATA = [
  {
    name: "Apex Black Travel Elite",
    subtitle: "Titanium Metal Edition",
    number: "•••• •••• •••• 9823",
    cvv: "348",
    expiry: "12/30",
    limit: 1000000,
    spent: 7499,
    type: "Travel Elite",
    benefits: [
      "5X Rewards on travel bookings",
      "Complimentary Airport Lounge access",
      "Premium Travel Insurance up to ₹50L",
      "24/7 Dedicated Concierge Support"
    ],
    bgClass: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border-slate-700"
  },
  {
    name: "Apex Cashback Plus",
    subtitle: "Everyday Platinum Rewards",
    number: "•••• •••• •••• 8847",
    cvv: "192",
    expiry: "08/29",
    limit: 500000,
    spent: 10620,
    type: "Cashback Plus",
    benefits: [
      "5% Direct Cashback on all online spend",
      "2% Unlimited Cashback on dining & utility",
      "Complimentary annual Amazon Prime",
      "1% Fuel surcharge waiver across India"
    ],
    bgClass: "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white border-emerald-800"
  },
  {
    name: "Apex Gold Select",
    subtitle: "Prestige Privilege Card",
    number: "•••• •••• •••• 4125",
    cvv: "567",
    expiry: "05/31",
    limit: 1500000,
    spent: 0,
    type: "Gold Select",
    benefits: [
      "10X Reward points on international spending",
      "Global Golf Privilege passes",
      "Exclusive curated dining invites",
      "Zero liability on lost card protection"
    ],
    bgClass: "bg-gradient-to-br from-amber-950 via-amber-900 to-slate-900 text-white border-amber-700"
  }
];

export default function Home() {
  // Current user authentication state - defaults to Bharadwaj
  const [user, setUser] = useState<User | null>(DEMO_PROFILES[0]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const openAuth = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    setIsProfileMenuOpen(false);
  };

  // Card management state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [frozenCards, setFrozenCards] = useState([false, false, false]);
  const [cardLimits, setCardLimits] = useState([500000, 250000, 750000]);
  const [showCardNumbers, setShowCardNumbers] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
  const [txnFilter, setTxnFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [txnSearch, setTxnSearch] = useState('');

  // Modals state
  const [isOutflowDrawerOpen, setIsOutflowDrawerOpen] = useState(false);
  const [isWireModalOpen, setIsWireModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Wire Transfer Form State
  const [wireRecipient, setWireRecipient] = useState('Kohli (Account • 9921)');
  const [wireAmount, setWireAmount] = useState('');
  const [wirePurpose, setWirePurpose] = useState('Personal Transfer');
  const [wireSuccessMsg, setWireSuccessMsg] = useState('');

  // Dynamic user balances
  const [currentSavings, setCurrentSavings] = useState(user?.accounts?.savings_balance ?? 828456.50);
  const [currentWealth, setCurrentWealth] = useState(user?.accounts?.wealth_balance ?? 200000.00);

  // Update balances when user changes
  useEffect(() => {
    if (user?.accounts?.savings_balance !== undefined) {
      setCurrentSavings(user.accounts.savings_balance);
    }
    if (user?.accounts?.wealth_balance !== undefined) {
      setCurrentWealth(user.accounts.wealth_balance);
    }
  }, [user]);

  // Load persisted session on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch {
          // fallback to Bharadwaj
        }
      }
    }
  }, []);

  const handleAuthSuccess = (userData: User, userToken: string) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', userToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }
    setIsAuthModalOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleSignOut = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    setIsProfileMenuOpen(false);
  };

  const handleSwitchDemo = (demoUser: User) => {
    setUser(demoUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', `demo_token_${demoUser.id}`);
      localStorage.setItem('auth_user', JSON.stringify(demoUser));
    }
    setIsProfileMenuOpen(false);
  };

  // Portfolio aggregates
  const mutualFunds = user?.investments?.mutual_funds ?? 250000.00;
  const fixedDeposits = user?.investments?.fixed_deposits ?? 100000.00;
  const goldBonds = user?.investments?.gold_bonds ?? 62500.00;
  const totalPortfolioValue = mutualFunds + fixedDeposits + goldBonds;
  const totalAssets = currentSavings + currentWealth + totalPortfolioValue;

  const toggleFreezeCard = (idx: number) => {
    setFrozenCards(prev => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  const handleLimitChange = (idx: number, val: number) => {
    setCardLimits(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const triggerAIConsult = (query: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger_ai_chat', { detail: { text: query } }));
    }
  };

  const handleExecuteWire = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(wireAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (amountNum > currentSavings) {
      alert("Insufficient funds in savings balance.");
      return;
    }

    // Deduct from savings balance
    setCurrentSavings(prev => prev - amountNum);

    // Append to transactions ledger
    const newTxn: Transaction = {
      id: `wire_${Date.now()}`,
      name: `Wire Transfer to ${wireRecipient}`,
      date: "Just now (Oct 13, 2026)",
      account: "Account • 4501",
      amount: -amountNum,
      type: "debit",
      category: "Transfer & Settlement",
      status: "Settled",
      reference: `WIRE-${Math.floor(1000000 + Math.random() * 9000000)}`,
      details: {
        counterparty: wireRecipient,
        cashback: "N/A",
        taxStatus: "Verified"
      }
    };

    setTransactions(prev => [newTxn, ...prev]);
    setWireSuccessMsg(`Successfully transferred ₹${amountNum.toLocaleString('en-IN')} to ${wireRecipient}.`);
    setWireAmount('');

    setTimeout(() => {
      setWireSuccessMsg('');
      setIsWireModalOpen(false);
    }, 1800);
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    if (txnFilter === 'debit' && t.type !== 'debit') return false;
    if (txnFilter === 'credit' && t.type !== 'credit') return false;
    if (txnSearch.trim()) {
      const q = txnSearch.toLowerCase();
      return t.name.toLowerCase().includes(q) || 
             t.reference.toLowerCase().includes(q) || 
             t.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 selection:bg-amber-100 selection:text-amber-900">
      {/* Background architectural grid */}
      <div className="fixed inset-0 bg-subtle-grid pointer-events-none opacity-40"></div>

      {/* Classic Human-Crafted Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo: BankingAI */}
            <div className="flex items-center space-x-10">
              <a href="#" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-serif font-bold text-xl flex items-center justify-center shadow-xs group-hover:border-amber-400 transition-colors">
                  B
                </div>
                <div>
                  <div className="text-lg font-serif font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    BankingAI
                    <span className="hidden sm:inline-block text-[9px] font-sans font-semibold tracking-wider text-amber-800 uppercase px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50">
                      Smart Banking
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 tracking-wider uppercase font-mono">
                    Personal & Private Accounts
                  </p>
                </div>
              </a>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-7 text-xs font-semibold text-slate-600">
                <a href="#overview" className="text-slate-900 border-b-2 border-slate-900 pb-1 transition-colors">
                  Dashboard
                </a>
                <a href="#accounts" className="hover:text-slate-900 transition-colors pb-1">
                  Accounts & Vaults
                </a>
                <button 
                  onClick={() => { setSelectedCardIndex(0); setIsCardModalOpen(true); }}
                  className="hover:text-slate-900 transition-colors pb-1 text-left font-semibold"
                >
                  Cards
                </button>
                <a href="#investments" className="hover:text-slate-900 transition-colors pb-1">
                  Investments
                </a>
              </nav>
            </div>

            {/* Right: Security Badge & User Authentication */}
            <div className="flex items-center space-x-5">
              {/* Status indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active Protection</span>
              </div>

              {/* User Auth Pill & Dropdown */}
              <div className="relative">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center gap-3 p-1.5 pr-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-xs"
                    >
                      <div className="w-8 h-8 rounded-lg border border-amber-200 bg-amber-100/70 text-amber-800 font-serif font-bold text-xs flex items-center justify-center">
                        {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-xs font-bold text-slate-900">
                          {user.fullName || user.username}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {user.tier || "Priority Client"}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">▾</span>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 bg-white shadow-xl p-3 z-50 text-xs">
                        <div className="px-2 py-2 border-b border-slate-100 mb-2">
                          <p className="font-bold text-slate-900">{user.fullName || user.username}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{maskEmail(user.email)}</p>
                          <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                            Verified Member
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 px-2 pt-1 font-mono font-semibold">Switch Account</p>
                          {DEMO_PROFILES.map((dp) => (
                            <button
                              key={dp.id}
                              onClick={() => handleSwitchDemo(dp)}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between ${
                                user.username === dp.username
                                  ? 'bg-amber-50 text-amber-900 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{dp.fullName}</span>
                              {user.username === dp.username && <span className="text-amber-700 font-bold">✓</span>}
                            </button>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 mt-2 pt-2 space-y-1">
                          <button
                            onClick={() => { setIsProfileMenuOpen(false); setIsStatementModalOpen(true); }}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Download Statement
                          </button>
                          <button
                            onClick={() => openAuth('login')}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Log In with Other Account
                          </button>
                          <button
                            onClick={() => openAuth('signup')}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Sign Up New Account
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                          >
                            Log Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAuth('login')}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => openAuth('signup')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero: Human Editorial Welcome & Financial Summary */}
      <section id="overview" className="relative py-8 lg:py-12 border-b border-slate-200/60 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Personalized Human Greeting & Quick Actions */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold">
                <span>🌱</span>
                <span>Annualized Yield: +2.5% • Cashflow: Healthy</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-slate-900 leading-tight">
                {user ? `Good evening, ${user.fullName || 'Bharadwaj'}.` : 'Good evening, Bharadwaj.'}
                <span className="block text-xl md:text-2xl font-sans font-normal text-slate-600 mt-1">
                  Your consolidated assets stand at{' '}
                  <span className="font-serif font-bold text-slate-900">
                    ₹{totalAssets.toLocaleString('en-IN')}
                  </span>
                </span>
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Track real-time transactions, manage cards with zero hassle, plan investment ladders, and consult with the built-in BankingAI assistant.
              </p>

              {/* Human Quick Action Bar */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setIsWireModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-sm transition-all flex items-center gap-2"
                >
                  <span>↗</span>
                  <span>Send Money</span>
                </button>

                <button
                  onClick={() => setIsStatementModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs font-semibold transition-all flex items-center gap-2 shadow-xs"
                >
                  <span>📄</span>
                  <span>View Statement</span>
                </button>

                <button
                  onClick={() => triggerAIConsult("Hello! I need some financial assistance.")}
                  className="px-5 py-2.5 rounded-xl border border-amber-300 hover:border-amber-400 bg-amber-50/70 text-amber-900 text-xs font-semibold transition-all flex items-center gap-2 shadow-xs"
                >
                  <span>💬</span>
                  <span>Ask Assistant</span>
                </button>
              </div>
            </div>

            {/* Right Column: Physical Credit Card Preview */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div 
                onClick={() => { setSelectedCardIndex(0); setIsCardModalOpen(true); }}
                className="w-full max-w-sm h-52 rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-700 shadow-xl relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform group"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-serif font-bold text-amber-300 tracking-wider uppercase">
                      Apex Black Travel Elite
                    </p>
                    <p className="text-[10px] text-slate-300 font-mono">
                      Priority Card • {user?.tier || "Priority Client"}
                    </p>
                  </div>
                  {/* Metallic Chip */}
                  <div className="w-9 h-7 rounded border border-amber-600/40 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-inner flex flex-col justify-center gap-0.5 px-1">
                    <div className="h-0.5 w-full bg-amber-700/40 rounded"></div>
                    <div className="h-0.5 w-full bg-amber-700/40 rounded"></div>
                  </div>
                </div>

                {/* Card Number */}
                <div className="my-5">
                  <p className="font-mono text-lg tracking-widest text-slate-100 font-semibold">
                    •••• •••• •••• 9823
                  </p>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-slate-400 font-mono">Cardholder</p>
                    <p className="font-semibold text-slate-200 tracking-wider">
                      {user?.fullName?.toUpperCase() || "BHARADWAJ"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-wider text-slate-400 font-mono">Expires</p>
                    <p className="font-mono text-slate-300">12/30</p>
                  </div>
                </div>

                {/* Hover hint */}
                <div className="absolute bottom-2 right-4 text-[9px] text-amber-300/80 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  Manage Card Settings →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Core Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-10">
        {/* Metric Cards Row */}
        <div id="accounts" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Operating Savings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative group hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Primary Balance</span>
                <h3 className="text-xs font-bold text-slate-900 mt-0.5">Elite Savings • 4501</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold">
                4.5% p.a.
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                ₹{currentSavings.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500">
                Available for transfers, bill payments, and daily expenses
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setIsWireModalOpen(true)}
                className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Send Money
              </button>
              <button
                onClick={() => triggerAIConsult("Compare fixed deposit rates")}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                Optimize Yield
              </button>
            </div>
          </div>

          {/* 2. Wealth Management Vault */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative group hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Wealth Vault</span>
                <h3 className="text-xs font-bold text-slate-900 mt-0.5">High-Yield Wealth • 9102</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold">
                6.2% p.a.
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                ₹{currentWealth.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500">
                Auto-sweep enabled across short-term treasury investments
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => triggerAIConsult("Compare fixed deposit ladder strategy")}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                FD Ladder
              </button>
              <button
                onClick={() => triggerAIConsult("Compare investment options")}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                Auto-Invest
              </button>
            </div>
          </div>

          {/* 3. Monthly Outflow Insights */}
          <div 
            onClick={() => setIsOutflowDrawerOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative group hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Monthly Outflow</span>
                <h3 className="text-xs font-bold text-slate-900 mt-0.5">July 2026 Analysis</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                Details →
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                ₹2,40,720
              </p>
              <p className="text-xs text-slate-500">
                Savings rate 49.8% • Discretionary spending within target limits
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Savings Rate: <strong className="text-emerald-700 font-mono">49.8%</strong></span>
              <span className="text-amber-800 font-bold">View Breakdown →</span>
            </div>
          </div>
        </div>

        {/* Section: Live Ledger (Transactions) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">
                Recent Activity & Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time clearing, settled merchant outflows, and salary deposits
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  onClick={() => setTxnFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    txnFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Entries
                </button>
                <button
                  onClick={() => setTxnFilter('credit')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    txnFilter === 'credit' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inflows
                </button>
                <button
                  onClick={() => setTxnFilter('debit')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    txnFilter === 'debit' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Outflows
                </button>
              </div>

              <input
                type="text"
                placeholder="Search transaction..."
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white w-48 transition-colors"
              />
            </div>
          </div>

          {/* Ledger List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No transactions matched your criteria.
              </div>
            ) : (
              filteredTransactions.map((txn) => (
                <div
                  key={txn.id}
                  onClick={() => setExpandedTxnId(expandedTxnId === txn.id ? null : txn.id)}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 p-4 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold ${
                        txn.type === 'credit'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}>
                        {txn.type === 'credit' ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {txn.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {txn.date} • {txn.account} • {txn.category}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-mono font-bold ${
                        txn.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {txn.type === 'credit' ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {txn.status} • {txn.reference}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Receipt Detail */}
                  {expandedTxnId === txn.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Merchant / Counterparty</p>
                        <p className="font-semibold text-slate-800">{txn.details?.counterparty || "Direct Clearing"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Cashback / Benefit</p>
                        <p className="font-semibold text-amber-700">{txn.details?.cashback || "Standard"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Tax / Accounting</p>
                        <p className="font-semibold text-slate-800">{txn.details?.taxStatus || "Settled"}</p>
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerAIConsult(`I want to dispute transaction ${txn.reference} for ₹${Math.abs(txn.amount)}`);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors"
                        >
                          Dispute Charge
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section: Investments & Portfolio */}
        <section id="investments" className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">
                Investment Portfolio & Assets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Asset valuation, returns, and allocation breakdown
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-serif font-bold text-slate-900">
                ₹{totalPortfolioValue.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] font-mono text-emerald-700 font-bold">
                📈 Total Return: +18.4%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mutual Funds */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Mutual Funds</span>
                <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">+14.2%</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Apex Balanced Fund</h4>
                <p className="text-xl font-serif font-bold text-slate-900 mt-1">₹{mutualFunds.toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => triggerAIConsult("Recommend mutual funds to invest")}
                className="w-full py-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-xs font-semibold text-slate-800 transition-colors shadow-xs"
              >
                Rebalance Portfolio
              </button>
            </div>

            {/* Fixed Deposits */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Fixed Deposits</span>
                <span className="text-amber-800 font-mono text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">7.1% p.a.</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">12-Month Cumulative</h4>
                <p className="text-xl font-serif font-bold text-slate-900 mt-1">₹{fixedDeposits.toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => triggerAIConsult("Compare fixed deposit ladder strategy")}
                className="w-full py-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-xs font-semibold text-slate-800 transition-colors shadow-xs"
              >
                FD Ladder Planner
              </button>
            </div>

            {/* Sovereign Gold */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Digital Gold</span>
                <span className="text-amber-800 font-mono text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">+22.1%</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Sovereign Gold Bonds</h4>
                <p className="text-xl font-serif font-bold text-slate-900 mt-1">₹{goldBonds.toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => triggerAIConsult("Compare gold vs equity options")}
                className="w-full py-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-xs font-semibold text-slate-800 transition-colors shadow-xs"
              >
                Buy More Assets
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-slate-500 text-xs mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-serif font-bold text-xs flex items-center justify-center">
              B
            </div>
            <span>BankingAI — Intelligent Banking & Wealth Management Platform</span>
          </div>
          <div className="flex gap-6 text-slate-500">
            <a href="#" className="hover:text-slate-800">Security</a>
            <a href="#" className="hover:text-slate-800">Privacy</a>
            <a href="#" className="hover:text-slate-800">Terms of Service</a>
            <a href="#" className="hover:text-slate-800">Support</a>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Send Money / Wire Modal */}
      {isWireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsWireModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Send Money</h3>
                <p className="text-[11px] text-slate-500">Instant Transfer via BankingAI</p>
              </div>
              <button 
                onClick={() => setIsWireModalOpen(false)}
                className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {wireSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-2">
                <span className="text-2xl block">✓</span>
                <p className="font-bold">{wireSuccessMsg}</p>
                <p className="text-[10px] text-slate-500 font-mono">Transaction added to ledger.</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteWire} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beneficiary
                  </label>
                  <select
                    value={wireRecipient}
                    onChange={(e) => setWireRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Kohli (Account • 9921)">Kohli (Account • 9921)</option>
                    <option value="Ronaldo (Account • 7707)">Ronaldo (Account • 7707)</option>
                    <option value="Amazon Online Retail">Amazon Retail Payment</option>
                    <option value="Freshmart Grocery">Freshmart Supermarket</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Amount (INR)</label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Available: ₹{currentSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="500"
                    max={currentSavings}
                    value={wireAmount}
                    onChange={(e) => setWireAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose / Note
                  </label>
                  <input
                    type="text"
                    value={wirePurpose}
                    onChange={(e) => setWirePurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                  <span>Transfer Fee: Free</span>
                  <span className="text-emerald-700 font-bold">Instant Credit</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-sm transition-all mt-2"
                >
                  Confirm & Transfer Funds
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Account Statement */}
      {isStatementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsStatementModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl text-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded border border-amber-300 bg-amber-50 text-amber-800 font-serif font-bold text-xs flex items-center justify-center">
                    B
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">BankingAI Official Statement</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Statement Period: July 01 - July 31, 2026
                </p>
              </div>
              <button 
                onClick={() => setIsStatementModalOpen(false)}
                className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="my-6 grid grid-cols-2 gap-4 text-xs font-mono text-slate-700 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Account Holder</p>
                <p className="font-bold text-slate-900">{user?.fullName || "BHARADWAJ"}</p>
                <p className="text-[11px] text-slate-500 mt-1">Tier: {user?.tier || "Priority Client"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase">Account Reference</p>
                <p className="font-bold text-slate-900">AC-4501-8847</p>
                <p className="text-[11px] text-slate-500 mt-1">Status: Active & Verified</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Statement Line Items</h4>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-900">{t.name}</span>
                      <p className="text-[10px] text-slate-500 font-mono">{t.date} • {t.reference}</p>
                    </div>
                    <span className={`font-mono font-bold ${t.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {t.type === 'credit' ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                Consolidated Balance: <strong className="text-slate-900 font-bold">₹{totalAssets.toLocaleString('en-IN')}</strong>
              </span>
              <button
                onClick={() => {
                  alert("PDF statement generated and downloaded successfully.");
                  setIsStatementModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Download Statement PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Cards Manager Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-slate-900">
            {/* Left Column: Selector */}
            <div className="p-6 md:w-5/12 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 space-y-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Active Credit Cards</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a card to configure limits and controls.</p>
              </div>

              <div className="space-y-2 pt-2">
                {CARDS_DATA.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCardIndex(idx)}
                    className={`w-full p-3.5 rounded-xl flex items-center justify-between text-left border transition-all ${
                      selectedCardIndex === idx
                        ? 'bg-white border-amber-500 shadow-sm text-slate-900 font-bold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{card.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{card.number}</p>
                    </div>
                    {frozenCards[idx] && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        Frozen
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setIsCardModalOpen(false)}
                className="w-full mt-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Close Manager
              </button>
            </div>

            {/* Right Column: Card Preview & Controls */}
            <div className="p-6 md:w-7/12 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-serif font-bold text-slate-900">{CARDS_DATA[selectedCardIndex].name}</h4>
                  <p className="text-xs text-slate-500">{CARDS_DATA[selectedCardIndex].subtitle}</p>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold">
                  {CARDS_DATA[selectedCardIndex].type}
                </span>
              </div>

              {/* Physical Card Preview */}
              <div className={`w-full h-44 rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden shadow-lg ${CARDS_DATA[selectedCardIndex].bgClass}`}>
                {frozenCards[selectedCardIndex] && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <span className="text-xs font-mono font-bold tracking-widest text-rose-300 border border-rose-500/40 bg-rose-950/70 px-3 py-1 rounded-lg">
                      🔒 CARD FROZEN
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-serif font-bold uppercase tracking-wider">{CARDS_DATA[selectedCardIndex].name}</p>
                    <p className="text-[9px] opacity-75">BankingAI Member</p>
                  </div>
                  <div className="w-8 h-6 rounded bg-gradient-to-r from-amber-400 to-amber-600"></div>
                </div>

                <div className="my-2">
                  <p className="font-mono text-lg tracking-widest font-semibold">
                    {showCardNumbers 
                      ? (selectedCardIndex === 0 ? "4532 9823 8472 9823" : selectedCardIndex === 1 ? "4291 8847 2981 8847" : "4125 5678 9845 4125")
                      : CARDS_DATA[selectedCardIndex].number}
                  </p>
                </div>

                <div className="flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider opacity-60 font-mono">Cardholder</p>
                    <p className="font-bold tracking-wider">
                      {user?.fullName?.toUpperCase() || "BHARADWAJ"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-wider opacity-60 font-mono">CVV / Expiry</p>
                    <p className="font-mono">
                      {showCardNumbers ? CARDS_DATA[selectedCardIndex].cvv : "•••"} / {CARDS_DATA[selectedCardIndex].expiry}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-1">
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleFreezeCard(selectedCardIndex)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      frozenCards[selectedCardIndex]
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-rose-50 border-rose-300 text-rose-700'
                    }`}
                  >
                    {frozenCards[selectedCardIndex] ? '✓ Unfreeze Card' : '🔒 Freeze Card'}
                  </button>

                  <button
                    onClick={() => setShowCardNumbers(!showCardNumbers)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
                  >
                    {showCardNumbers ? 'Mask Details' : 'Reveal Details'}
                  </button>
                </div>

                {/* Limit Slider */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-semibold">Online Spending Limit</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{cardLimits[selectedCardIndex].toLocaleString('en-IN')} / ₹{CARDS_DATA[selectedCardIndex].limit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max={CARDS_DATA[selectedCardIndex].limit}
                    step="5000"
                    value={cardLimits[selectedCardIndex]}
                    onChange={(e) => handleLimitChange(selectedCardIndex, parseInt(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* Benefits List */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Privileges</p>
                  <ul className="text-xs space-y-1 text-slate-700">
                    {CARDS_DATA[selectedCardIndex].benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: Outflow Breakdown */}
      {isOutflowDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="absolute inset-0" onClick={() => setIsOutflowDrawerOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 text-slate-900">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Outflow Analysis</h3>
                  <p className="text-[11px] text-slate-500 font-mono">July 2026 Monthly Breakdown</p>
                </div>
                <button 
                  onClick={() => setIsOutflowDrawerOpen(false)}
                  className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Total Monthly Outflow</span>
                <p className="text-2xl font-serif font-bold text-slate-900">₹2,40,720</p>
                <p className="text-[11px] text-emerald-700 font-mono font-semibold">49.8% channeled into investments and savings</p>
              </div>

              {/* Breakdown Categories */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-mono font-bold">Category Distribution</h4>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Savings & Investments</span>
                    <span className="font-mono font-bold">₹1,20,000 (49.8%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 w-[49.8%]"></div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Loan EMIs</span>
                    <span className="font-mono font-bold">₹45,000 (18.7%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 w-[18.7%]"></div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Rent Payments</span>
                    <span className="font-mono font-bold">₹25,000 (10.4%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 w-[10.4%]"></div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Discretionary (Shopping & Dining)</span>
                    <span className="font-mono font-bold">₹30,899 (12.8%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[12.8%]"></div>
                  </div>
                </div>
              </div>

              {/* Budget warning notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <span>💡</span>
                <span>Discretionary spending on Swiggy and Amazon retail has increased slightly by +₹3,400 over baseline.</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOutflowDrawerOpen(false);
                triggerAIConsult("Analyze my monthly outflow");
              }}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide transition-colors mt-6 shadow-sm"
            >
              Analyze with BankingAI Assistant →
            </button>
          </div>
        </div>
      )}

      {/* Floating BankingAI Assistant */}
      <ChatDock user={user} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
