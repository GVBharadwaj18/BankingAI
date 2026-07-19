'use client';

import { useState } from 'react';
import ChatDock from '@/components/ChatDock';

const CARDS_DATA = [
  {
    name: "Apex Black Travel Elite",
    number: "•••• •••• •••• 9823",
    cvv: "348",
    expiry: "12/30",
    limit: 1000000,
    spent: 7499,
    type: "travel",
    benefits: [
      "5X Rewards on travel bookings",
      "Complimentary Airport Lounge access",
      "Premium Travel Insurance up to ₹50L",
      "24/7 Dedicated Concierge Support"
    ],
    gradient: "from-slate-950 via-[#191433] to-slate-950 border-purple-500/20 text-purple-400"
  },
  {
    name: "Apex Cashback Plus",
    number: "•••• •••• •••• 8847",
    cvv: "192",
    expiry: "08/29",
    limit: 500000,
    spent: 10620,
    type: "cashback",
    benefits: [
      "5% Direct Cashback on all online spend",
      "2% Unlimited Cashback on dining & utility",
      "Complimentary annual Amazon Prime",
      "1% Fuel surcharge waiver across India"
    ],
    gradient: "from-[#250d2d] via-[#db2777] to-[#4c0519] border-pink-400/30 text-pink-200"
  },
  {
    name: "Apex Gold Select",
    number: "•••• •••• •••• 4125",
    cvv: "567",
    expiry: "05/31",
    limit: 1500000,
    spent: 0,
    type: "premium",
    benefits: [
      "10X Reward points on international spending",
      "Global Golf Privilege passes",
      "Exclusive curated dining invites",
      "Zero liability on lost card protection"
    ],
    gradient: "from-[#2d2208] via-[#e2a93c] to-[#925f00] border-amber-300/30 text-amber-950"
  }
];

export default function Home() {
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [frozenCards, setFrozenCards] = useState([false, false, false]);
  const [cardLimits, setCardLimits] = useState([500000, 250000, 750000]);
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
  const [isOutflowDrawerOpen, setIsOutflowDrawerOpen] = useState(false);

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
    window.dispatchEvent(new CustomEvent('trigger_ai_chat', { detail: { text: query } }));
  };

  return (
    <div className="min-h-screen bg-gradient-dark font-sans text-white selection:bg-purple-500/30 selection:text-purple-300 overflow-x-hidden">
      {/* Decorative glow overlays */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#05050a]/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-12">
              <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center text-white font-bold text-base shadow-neon">
                  A
                </div>
                <span>Apex<span className="text-accent-neon">Bank</span></span>
              </h1>
              <nav className="hidden md:flex space-x-8 text-sm font-medium text-white/60">
                <a href="#dashboard" className="text-white border-b-2 border-accent-neon pb-2 transition-all">Dashboard</a>
                <a href="#accounts" className="hover:text-white transition-colors pb-2">Accounts</a>
                <button onClick={() => { setSelectedCardIndex(0); setIsCardModalOpen(true); }} className="hover:text-white transition-colors pb-2 text-left">Cards</button>
                <a href="#investments" className="hover:text-white transition-colors pb-2">Investments</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-2 bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-purple-400">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span>AI Assistant: Active</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-white">V. Bharadwaj</div>
                  <div className="text-xs text-white/50">Priority Elite</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-neon hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <span className="text-white font-bold text-lg">VB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-slate-950/60 rounded-3xl shadow-glass-lg border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent pointer-events-none"></div>
            
            <div className="relative grid lg:grid-cols-12 gap-12 lg:gap-16 items-center p-8 lg:p-14">
              {/* Text Content */}
              <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-neon/10 border border-accent-neon/30 text-xs font-semibold text-accent-neon">
                  ✨ Powered by Advanced Agentic AI
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white leading-tight tracking-tight">
                  Next-Gen Banking{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon via-purple-400 to-indigo-400">
                    Made Smarter
                  </span>
                </h1>
                
                <p className="text-base lg:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Experience intelligent cashflow insights, custom-tailored investment plans, and instantaneous slot-filling conversation tools. Secure, semantic, and built for you.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <button onClick={() => triggerAIConsult("Hello! I need some financial assistance.")} className="px-8 py-4 bg-gradient-accent text-white rounded-xl font-bold hover:shadow-neon-lg transition-all duration-300 transform hover:scale-105">
                    Launch Assistant
                  </button>
                  <button onClick={() => { setSelectedCardIndex(0); setIsCardModalOpen(true); }} className="px-8 py-4 backdrop-blur-sm bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                    View Premium Cards
                  </button>
                </div>
              </div>

              {/* Interactive Credit Cards Visual */}
              <div className="lg:col-span-5 relative flex justify-center items-center h-80 lg:h-96">
                {/* Background glowing orb */}
                <div className="absolute w-60 h-60 bg-accent-neon/10 rounded-full blur-3xl"></div>
                
                {/* Card 1 - Travel card mockup */}
                <div 
                  onClick={() => { setSelectedCardIndex(0); setIsCardModalOpen(true); }} 
                  className="absolute transform rotate-12 translate-x-8 translate-y-4 hover:rotate-6 hover:-translate-y-2 transition-all duration-500 cursor-pointer z-10"
                >
                  <div className="w-72 h-44 bg-gradient-to-br from-slate-950 via-[#17142d] to-slate-950 rounded-2xl shadow-glass border border-purple-500/20 p-6 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Apex Black</p>
                        <p className="text-[10px] opacity-40">Priority Member</p>
                      </div>
                      {/* SIM Chip Icon */}
                      <div className="w-8 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-md shadow-inner"></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-white font-mono text-lg tracking-widest font-semibold">•••• •••• •••• 9823</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] text-white/40 uppercase">Card Holder</p>
                          <p className="text-xs font-semibold text-white/90">V. BHARADWAJ</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-white/40 uppercase">Expires</p>
                          <p className="text-xs font-semibold text-white/90">12/30</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 - Cashback card mockup */}
                <div 
                  onClick={() => { setSelectedCardIndex(1); setIsCardModalOpen(true); }} 
                  className="absolute transform -rotate-8 -translate-x-8 -translate-y-4 hover:rotate-0 hover:-translate-y-8 transition-all duration-500 cursor-pointer z-20"
                >
                  <div className="w-72 h-44 bg-gradient-to-br from-[#250d2d] via-[#db2777] to-[#4c0519] rounded-2xl shadow-glass-lg border border-pink-400/30 p-6 relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-start mb-6 text-white">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-pink-200">Apex Cashback</p>
                        <p className="text-[10px] text-pink-200/60">Plus Tier</p>
                      </div>
                      <div className="w-8 h-6 bg-gradient-to-br from-slate-200 to-slate-400 rounded-md"></div>
                    </div>
                    <div className="space-y-3 text-white">
                      <p className="font-mono text-lg tracking-widest font-bold">•••• •••• •••• 8847</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] text-white/60 uppercase">Card Holder</p>
                          <p className="text-xs font-bold">V. BHARADWAJ</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-white/60 uppercase">Expires</p>
                          <p className="text-xs font-bold">08/29</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <main id="dashboard" className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Balance Card */}
          <div className="relative backdrop-blur-lg bg-[#0e172e]/60 rounded-2xl shadow-glass p-8 border border-white/10 group hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">Total Assets</p>
                <p className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">₹10,28,456.50</p>
              </div>
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs">
              <span className="text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/15">+2.5%</span>
              <span className="text-white/50 ml-3">yield gain this month</span>
            </div>
          </div>

          {/* Cards Card */}
          <div 
            onClick={() => { setSelectedCardIndex(0); setIsCardModalOpen(true); }}
            className="relative backdrop-blur-lg bg-[#0e172e]/60 rounded-2xl shadow-glass p-8 border border-white/10 group hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">Active Cards</p>
                <p className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">3</p>
              </div>
              <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 space-y-1">
              <div className="flex justify-between text-xs text-white/70">
                <span>Visa Travel Elite</span>
                <span className="font-semibold text-white">• 9823</span>
              </div>
              <div className="flex justify-between text-xs text-white/70">
                <span>Gold Cashback Select</span>
                <span className="font-semibold text-white">• 8847</span>
              </div>
            </div>
          </div>

          {/* Outflow Insights Card */}
          <div 
            onClick={() => setIsOutflowDrawerOpen(true)}
            className="relative backdrop-blur-lg bg-[#0e172e]/60 rounded-2xl shadow-glass p-8 border border-white/10 group hover:border-pink-500/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">Monthly Outflow</p>
                <p className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">₹2,40,720</p>
              </div>
              <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs">
              <span className="text-pink-400 font-bold px-2 py-0.5 rounded bg-pink-500/15">+15%</span>
              <span className="text-white/50 ml-3">vs historical baseline</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="relative backdrop-blur-lg bg-slate-900/40 rounded-2xl shadow-glass p-8 border border-white/10 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Recent Activity</h2>
            <button onClick={() => triggerAIConsult("Show my statements for last 3 months")} className="text-xs text-accent-neon font-bold hover:underline">View All Statements</button>
          </div>
          
          <div className="space-y-4">
            {/* Txn 1: Amazon */}
            <div 
              onClick={() => setExpandedTxnId(expandedTxnId === 'txn1' ? null : 'txn1')}
              className="group flex flex-col p-4 rounded-xl bg-slate-950/30 border border-white/5 hover:bg-slate-950/50 hover:border-purple-500/20 transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-11 h-11 bg-pink-500/10 border border-pink-500/25 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white/95 text-sm">Amazon Online Purchase</p>
                    <p className="text-xs text-white/50">July 18, 2026 • Card *9823</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-pink-400 text-base">-₹7,499</span>
                  <p className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Settled</p>
                </div>
              </div>
              
              {expandedTxnId === 'txn1' && (
                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/60 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Transaction ID</p>
                    <p className="font-mono font-semibold text-white/80">TXN-AMZN-9874102</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Cashback Earned</p>
                    <p className="font-semibold text-pink-400">₹375 (5%)</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Category</p>
                    <p className="font-semibold text-white/80">Shopping & Retail</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerAIConsult("I want to dispute transaction TXN-AMZN-9874102 for ₹7,499"); }}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 rounded text-[10px] text-rose-400 font-bold transition-all"
                    >
                      Dispute Charge
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Txn 2: Salary */}
            <div 
              onClick={() => setExpandedTxnId(expandedTxnId === 'txn2' ? null : 'txn2')}
              className="group flex flex-col p-4 rounded-xl bg-slate-950/30 border border-white/5 hover:bg-slate-950/50 hover:border-purple-500/20 transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/25 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white/95 text-sm">Monthly Corporate Salary</p>
                    <p className="text-xs text-white/50">July 16, 2026 • Account *4501</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-purple-400 text-base">+₹2,91,500</span>
                  <p className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Settled</p>
                </div>
              </div>
              
              {expandedTxnId === 'txn2' && (
                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/60 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Transaction ID</p>
                    <p className="font-mono font-semibold text-white/80">TXN-PAYR-1029481</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Depositor</p>
                    <p className="font-semibold text-white/80">Apex Technologies Corp</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Category</p>
                    <p className="font-semibold text-white/80">Income / Salary</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2.5 py-1.5 rounded border border-purple-500/20 font-bold">Tax Withheld</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Txn 3: Grocery */}
            <div 
              onClick={() => setExpandedTxnId(expandedTxnId === 'txn3' ? null : 'txn3')}
              className="group flex flex-col p-4 rounded-xl bg-slate-950/30 border border-white/5 hover:bg-slate-950/50 hover:border-purple-500/20 transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white/95 text-sm">Freshmart Grocery Store</p>
                    <p className="text-xs text-white/50">July 14, 2026 • Card *8847</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-pink-400 text-base">-₹10,620</span>
                  <p className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Settled</p>
                </div>
              </div>
              
              {expandedTxnId === 'txn3' && (
                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/60 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Transaction ID</p>
                    <p className="font-mono font-semibold text-white/80">TXN-FRSH-4820194</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Cashback Earned</p>
                    <p className="font-semibold text-pink-400">₹212 (2%)</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Category</p>
                    <p className="font-semibold text-white/80">Groceries & Household</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerAIConsult("I want to dispute transaction TXN-FRSH-4820194 for ₹10,620"); }}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 rounded text-[10px] text-rose-400 font-bold transition-all"
                    >
                      Dispute Charge
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Manager Modal Overlay */}
        {isCardModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-[#0b0c16]/95 border border-purple-500/25 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">
              {/* Left Column: Visual Mockup */}
              <div className="p-8 md:w-[45%] bg-[#08080f] flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-bold text-white tracking-wide">Premium Cards</h3>
                  <p className="text-xs text-white/50">Select an active card to configure settings and view rewards.</p>
                  
                  {/* Card Selector tabs */}
                  <div className="space-y-2.5 pt-4">
                    {CARDS_DATA.map((card, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCardIndex(idx)}
                        className={`w-full p-4 rounded-xl flex items-center justify-between text-left border transition-all ${
                          selectedCardIndex === idx
                            ? "bg-purple-500/10 border-purple-500/60 shadow-neon"
                            : "bg-[#0b0b14]/50 border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-white/95">{card.name}</p>
                          <p className="text-[10px] text-white/40">{card.number}</p>
                        </div>
                        {frozenCards[idx] && (
                          <span className="text-[9px] bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 font-bold px-1.5 py-0.5 rounded">Frozen</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setIsCardModalOpen(false)}
                  className="mt-6 md:mt-0 w-full py-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-semibold transition-all text-xs"
                >
                  Close Manager
                </button>
              </div>

              {/* Right Column: Details & Management */}
              <div className="p-8 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold text-white">{CARDS_DATA[selectedCardIndex].name}</h4>
                    <p className="text-xs text-white/40">Active Elite Account Dashboard</p>
                  </div>
                  <span className="text-[10px] bg-purple-500/15 border border-purple-500/20 text-purple-400 font-bold px-2.5 py-0.5 rounded">
                    {CARDS_DATA[selectedCardIndex].type.toUpperCase()}
                  </span>
                </div>

                {/* Tactile Card Mockup in right column */}
                <div className={`w-full h-44 bg-gradient-to-br ${CARDS_DATA[selectedCardIndex].gradient} rounded-2xl border p-6 flex flex-col justify-between relative overflow-hidden shadow-glass-lg`}>
                  {/* Frosted ice overlay for frozen card */}
                  {frozenCards[selectedCardIndex] && (
                    <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[3px] border border-cyan-500/20 flex items-center justify-center rounded-xl z-20">
                      <span className="text-lg font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/80 px-4 py-2 border border-cyan-400/30 rounded-xl shadow-neon flex items-center gap-2">
                        ❄️ Card Frozen
                      </span>
                    </div>
                  )}

                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-60">Apex Platinum</p>
                      <p className="text-[8px] opacity-40">Priority Member</p>
                    </div>
                    <div className="w-8 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-md"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-xl tracking-widest font-bold">
                      {showCardNumbers 
                        ? (selectedCardIndex === 0 ? "4532 9823 8472 9823" : selectedCardIndex === 1 ? "4291 8847 2981 8847" : "4125 5678 9845 4125") 
                        : CARDS_DATA[selectedCardIndex].number}
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] opacity-40 uppercase">Card Holder</p>
                        <p className="text-xs font-bold">V. BHARADWAJ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] opacity-40 uppercase">CVV / EXP</p>
                        <p className="text-xs font-mono font-bold">
                          {showCardNumbers ? CARDS_DATA[selectedCardIndex].cvv : "•••"} / {CARDS_DATA[selectedCardIndex].expiry}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Panel */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider">Card Controls</h5>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => toggleFreezeCard(selectedCardIndex)}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        frozenCards[selectedCardIndex]
                          ? "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-neon"
                          : "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400"
                      }`}
                    >
                      {frozenCards[selectedCardIndex] ? "❄️ Unfreeze Card" : "🔒 Freeze Card"}
                    </button>

                    <button 
                      onClick={() => setShowCardNumbers(!showCardNumbers)}
                      className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
                    >
                      {showCardNumbers ? "👁️ Mask Details" : "👁️ Reveal Numbers"}
                    </button>
                  </div>

                  {/* Limit Slider */}
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white/80">Online Transaction Limit</span>
                      <span className="font-mono text-purple-400 font-bold">
                        ₹{cardLimits[selectedCardIndex].toLocaleString('en-IN')} / ₹{CARDS_DATA[selectedCardIndex].limit.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={CARDS_DATA[selectedCardIndex].limit}
                      step="5000"
                      value={cardLimits[selectedCardIndex]}
                      onChange={(e) => handleLimitChange(selectedCardIndex, parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  {/* Card Benefits */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Exclusive Privileges</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70">
                      {CARDS_DATA[selectedCardIndex].benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-purple-400 text-base">✓</span> {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Outflow sliding drawer */}
        {isOutflowDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setIsOutflowDrawerOpen(false)}></div>
            
            {/* Drawer Body */}
            <div className="relative w-full max-w-md bg-[#090a12]/98 border-l border-white/10 shadow-2xl p-8 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white tracking-wide">Outflow Analysis</h3>
                    <p className="text-xs text-white/40 font-mono">July 2026 Monthly Summary</p>
                  </div>
                  <button 
                    onClick={() => setIsOutflowDrawerOpen(false)}
                    className="p-1 text-white/60 hover:text-white bg-white/5 rounded-lg border border-white/5"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Total Monthly Outflow</p>
                      <h4 className="text-3xl font-extrabold text-pink-400">₹2,40,720</h4>
                    </div>
                    <span className="text-xs bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold px-2 py-0.5 rounded">
                      +15% baseline
                    </span>
                  </div>

                  {/* Budget warning notice */}
                  <div className="text-xs text-pink-400 font-medium bg-pink-500/5 border border-pink-500/10 rounded-xl p-4 flex items-start gap-2.5">
                    <span className="text-base">⚠️</span>
                    <div>
                      <p className="font-bold">Dining & Shopping Alert</p>
                      <p className="text-[11px] opacity-80 leading-relaxed mt-0.5">Discretionary spends on Swiggy and Amazon retail have exceeded historical benchmarks by +₹3,400.</p>
                    </div>
                  </div>

                  {/* Categories progression */}
                  <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider">Outflow Breakdown</h5>
                    
                    <div className="space-y-2.5">
                      {/* Category 1: Savings */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Savings & Investments</span>
                          <span className="font-semibold">₹1,20,000 (49.8%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500" style={{ width: "49.8%" }}></div>
                        </div>
                      </div>
                      
                      {/* Category 2: Loan EMI */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Loan EMIs</span>
                          <span className="font-semibold">₹45,000 (18.7%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: "18.7%" }}></div>
                        </div>
                      </div>

                      {/* Category 3: Rent */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Rent Payments</span>
                          <span className="font-semibold">₹25,000 (10.4%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: "10.4%" }}></div>
                        </div>
                      </div>

                      {/* Category 4: Discretionary */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Discretionary (Shopping & Dining)</span>
                          <span className="font-semibold">₹30,899 (12.8%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: "12.8%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consult AI Assistant Trigger */}
              <div className="space-y-3 pt-6 border-t border-white/10">
                <p className="text-[10px] text-white/40 leading-relaxed">Let Apex AI Assistant scan and classify all micro-transactions to find optimization opportunities.</p>
                <button 
                  onClick={() => {
                    setIsOutflowDrawerOpen(false);
                    triggerAIConsult("Analyze my monthly outflow");
                  }}
                  className="w-full py-4 bg-gradient-accent text-white rounded-xl font-bold hover:shadow-neon-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  💬 Consult AI Assistant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating ChatDock Component */}
        <ChatDock />
      </main>
    </div>
  );
}

