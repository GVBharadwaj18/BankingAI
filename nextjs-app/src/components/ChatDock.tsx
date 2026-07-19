/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  proposal?: {
    bullets?: string[];
    data?: Record<string, any>;
  };
  router?: {
    intent?: string;
    confidence?: string;
    score?: number;
  };
  showFeedback?: boolean;
  feedbackGiven?: boolean;
}

export default function ChatDock() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('chat_session_id');
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chat_session_id', sid);
      }
      setSessionId(sid);
    }
  }, []);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) {
      setInputText('');
    }
    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          text: textToSend,
          sessionId: sessionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply || 'Sorry, I could not process your request.',
          sender: 'assistant',
          proposal: data.proposal,
          router: data.router,
          showFeedback: data.showFeedback || false,
          feedbackGiven: false
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, there was an error processing your request. Please try again.',
          sender: 'assistant'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was a network error. Make sure the backend server is running.',
        sender: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Stable reference to handleSend for trigger events
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    const handleTriggerMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.text) {
        setIsOpen(true);
        setTimeout(() => {
          handleSendRef.current(customEvent.detail.text);
        }, 100);
      }
    };
    
    window.addEventListener('trigger_ai_chat', handleTriggerMessage);
    return () => {
      window.removeEventListener('trigger_ai_chat', handleTriggerMessage);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          helpful: true
        })
      });

      if (response.ok) {
        setMessages([]);
        const newSid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chat_session_id', newSid);
        setSessionId(newSid);
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          helpful: helpful
        })
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, feedbackGiven: true }
              : msg
          )
        );

        if (helpful) {
          const thankYouMessage: Message = {
            id: Date.now().toString(),
            text: 'Thank you for your feedback! Conversation history cleared to start fresh.',
            sender: 'assistant'
          };
          setMessages(prev => [...prev, thankYouMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const renderText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <span className="whitespace-pre-line leading-relaxed">
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="font-bold text-accent-neon">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </span>
    );
  };

  // Premium Custom Visual Widgets
  const renderProposalWidget = (proposal: any) => {
    if (!proposal || !proposal.data) return null;
    const data = proposal.data;

    // 1. Loan EMI Widget
    if (data.emi !== undefined && data.principal !== undefined) {
      const principal = data.principal;
      const totalInterest = data.total_interest || 0;
      const totalPayment = data.total_payment || (principal + totalInterest);
      const interestPercentage = (totalInterest / totalPayment) * 100;
      
      return (
        <div className="w-full bg-slate-900/80 border border-purple-500/20 rounded-xl p-4 mt-2 space-y-4 shadow-glass text-white font-sans overflow-hidden">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Estimated Monthly EMI</p>
              <h4 className="text-2xl font-extrabold text-purple-400">₹{Math.round(data.emi).toLocaleString('en-IN')}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded">EMI Quote</span>
            </div>
          </div>

          {/* Simple distribution bar */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-purple-400" style={{ width: `${100 - interestPercentage}%` }}></div>
              <div className="h-full bg-pink-400" style={{ width: `${interestPercentage}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-white/40">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Principal</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span> Interest</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/5">
            <div>
              <p className="text-white/40 text-[9px] uppercase">Loan Amount</p>
              <p className="font-semibold">₹{Math.round(principal).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase">Interest Rate</p>
              <p className="font-semibold text-purple-400">{data.rate}% p.a.</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase">Tenure Months</p>
              <p className="font-semibold">{data.tenure}m ({Math.round(data.tenure/12)} Years)</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase">Total Payable</p>
              <p className="font-semibold">₹{Math.round(totalPayment).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      );
    }

    // 2. Credit Card Recommendation Widget
    if (data.recommended_card !== undefined) {
      const cardType = data.recommended_card;
      const details = data.card_details || {};
      const cardColors: Record<string, string> = {
        travel: 'from-slate-900 via-[#1a102f] to-slate-900 border-purple-500/20 text-purple-400',
        cashback: 'from-slate-900 via-[#27102e] to-slate-900 border-pink-500/20 text-pink-400',
        premium: 'from-[#1e143b] via-[#8b5cf6] to-[#4c1d95] border-violet-400/30 text-violet-200',
        entry: 'from-slate-900 via-slate-800 to-slate-900 border-slate-500/20 text-slate-300',
      };
      const bgGradient = cardColors[cardType] || cardColors.entry;

      return (
        <div className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 mt-2 space-y-4 shadow-glass text-white font-sans">
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Recommended Credit Card</p>
          
          {/* Card Mockup */}
          <div className={`w-full h-36 bg-gradient-to-br ${bgGradient} rounded-xl border p-4 flex flex-col justify-between relative overflow-hidden shadow-glass`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider">{details.name || 'Apex Card'}</p>
                <p className="text-[9px] opacity-40">Elite Select</p>
              </div>
              <div className="w-6 h-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-sm"></div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-mono text-sm tracking-widest font-semibold">•••• •••• •••• {Math.floor(1000 + Math.random() * 9000)}</p>
                <p className="text-[8px] text-white/60 uppercase tracking-wider mt-1">Special Recommendation</p>
              </div>
              <div className="text-[9px] opacity-75 font-semibold">VALID THRU: 12/31</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Top Benefits</p>
            <ul className="text-xs space-y-1 text-white/80">
              {(details.benefits || []).slice(0, 3).map((benefit: string, idx: number) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-purple-400 text-xs">✓</span> {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between text-xs pt-3 border-t border-white/5 text-white/70">
            <span>Annual Fee: <strong className="text-white">₹{(details.annual_fee || 0).toLocaleString('en-IN')}</strong></span>
            <span>Reward Rate: <strong className="text-white">{details.reward_rate || 1}X</strong></span>
          </div>
        </div>
      );
    }

    // 3. Fixed Deposit Ladder Widget
    if (data.ladder !== undefined) {
      return (
        <div className="w-full bg-slate-900/80 border border-purple-500/20 rounded-xl p-4 mt-2 space-y-4 shadow-glass text-white font-sans">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">FD Ladder Strategy</p>
              <h4 className="text-lg font-bold text-purple-400">₹{(data.total_investment || 0).toLocaleString('en-IN')} Split</h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded">Returns optimized</span>
            </div>
          </div>

          {/* Ladder splits */}
          <div className="space-y-2">
            {(data.ladder || []).map((fd: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-purple-500/20 text-[10px] text-purple-400 font-bold flex items-center justify-center">FD-{fd.fd_number}</span>
                  <div>
                    <p className="font-semibold">₹{Math.round(fd.amount).toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-white/40">Tenure: {fd.tenure}m</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-400">{fd.rate}% p.a.</p>
                  <p className="text-[9px] text-white/40">Maturity: ₹{Math.round(fd.maturity_amount).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-white/5 text-white/70">
            <div>
              <p className="text-white/40 text-[9px] uppercase">Effective Rate</p>
              <p className="font-semibold text-purple-400">{data.effective_rate}%</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase">Total Interest</p>
              <p className="font-semibold text-pink-400">₹{Math.round(data.total_interest).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      );
    }

    // 4. Forex Conversion Widget
    if (data.currency !== undefined && data.exchange_rate !== undefined) {
      return (
        <div className="w-full bg-slate-900/80 border border-purple-500/20 rounded-xl p-4 mt-2 space-y-4 shadow-glass text-white font-sans">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Currency Exchange Conversion</p>
              <h4 className="text-xl font-bold text-purple-400">
                ₹{Math.round(data.inr_amount).toLocaleString('en-IN')} → {data.foreign_amount.toLocaleString()} {data.currency}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded">Live Rate Quote</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/5">
            <div>
              <p className="text-white/40 text-[9px] uppercase">Cash Rate</p>
              <p className="font-semibold text-white">1 {data.currency} = ₹{data.exchange_rate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase">Forex Card Rate</p>
              <p className="font-semibold text-purple-400">1 {data.currency} = ₹{data.card_rate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase">Markup (Inc.)</p>
              <p className="font-semibold text-white/70">2.0%</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase">Card Equivalent</p>
              <p className="font-semibold text-white">{data.card_amount.toLocaleString()} {data.currency}</p>
            </div>
          </div>
          
          <div className="text-[10px] text-white/40 flex justify-between items-center pt-1 border-t border-white/5">
            <span>Rate updated: {data.last_updated}</span>
            <span className="text-purple-400 font-semibold">Available for Booking</span>
          </div>
        </div>
      );
    }

    // 5. Security & Fraud Widget
    if (data.case_id !== undefined && data.status !== undefined) {
      const isUrgent = data.is_urgent;
      const borderClass = isUrgent ? 'border-rose-500/30 bg-slate-900/90' : 'border-amber-500/30 bg-slate-900/80';
      const badgeClass = isUrgent ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      const titleClass = isUrgent ? 'text-rose-400' : 'text-amber-400';
      
      return (
        <div className={`w-full border ${borderClass} rounded-xl p-4 mt-2 space-y-4 shadow-glass text-white font-sans`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Security Operations Center</p>
              <h4 className={`text-base font-extrabold ${titleClass} flex items-center gap-1.5`}>
                {isUrgent ? '🚨 Card Terminated / Blocked' : '📋 Incident Under Review'}
              </h4>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>{data.priority} Severity</span>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-white/40">Case ID:</span>
              <span className="font-mono font-bold text-white/95">{data.case_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Reference Txn:</span>
              <span className="font-mono text-white/95">{data.transaction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Resolution Time:</span>
              <span className="font-semibold text-white/95">{data.expected_resolution}</span>
            </div>
          </div>

          <div className="text-[10px] text-white/60 space-y-1 pt-1 border-t border-white/5">
            <p className="font-semibold text-white">Emergency Support Contacts:</p>
            <div className="flex justify-between">
              <span>📞 Card Blocking (24x7):</span>
              <span className="text-rose-400 font-semibold">1800-XXX-BLOCK</span>
            </div>
            <div className="flex justify-between">
              <span>🌐 Operations Desk:</span>
              <span className="text-accent-neon hover:underline cursor-pointer">apexbank.com/ops</span>
            </div>
          </div>
        </div>
      );
    }

    // 6. Spending Analysis Widget
    if (data.spending_breakdown !== undefined) {
      const list = data.spending_breakdown || [];
      const total = data.total_outflow || 240720;
      
      const categoryColors: Record<string, { bar: string; text: string; bg: string }> = {
        "Rent": { bar: "bg-indigo-500", text: "text-indigo-400", bg: "bg-indigo-500/10" },
        "EMI": { bar: "bg-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
        "Savings & MF": { bar: "bg-pink-500", text: "text-pink-400", bg: "bg-pink-500/10" },
        "Groceries": { bar: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-500/10" },
        "Shopping": { bar: "bg-rose-500", text: "text-rose-400", bg: "bg-rose-500/10" },
        "Dining & Food": { bar: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
        "Travel": { bar: "bg-violet-400", text: "text-violet-400", bg: "bg-violet-500/10" },
        "Utilities": { bar: "bg-cyan-500", text: "text-cyan-400", bg: "bg-cyan-500/10" },
        "Transport": { bar: "bg-teal-400", text: "text-teal-400", bg: "bg-teal-400/10" },
        "Entertainment": { bar: "bg-fuchsia-400", text: "text-fuchsia-400", bg: "bg-fuchsia-500/10" }
      };

      const defaultColors = { bar: "bg-slate-400", text: "text-slate-400", bg: "bg-slate-500/10" };

      return (
        <div className="w-full bg-slate-900/80 border border-purple-500/20 rounded-xl p-4 mt-2 space-y-4 shadow-glass text-white font-sans overflow-hidden">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Monthly Spending Audit</p>
              <h4 className="text-xl font-extrabold text-purple-400">₹{total.toLocaleString('en-IN')}</h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded animate-pulse">AI Audited</span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
            {list.slice(0, 5).map((item: any, idx: number) => {
              const colors = categoryColors[item.category] || defaultColors;
              return (
                <div 
                  key={idx} 
                  className={`h-full ${colors.bar} transition-all duration-500 hover:opacity-80 cursor-pointer`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.category}: ${item.percentage}%`}
                ></div>
              );
            })}
            <div className="h-full bg-slate-600" style={{ width: `${100 - list.slice(0, 5).reduce((acc: number, c: any) => acc + c.percentage, 0)}%` }} title="Others"></div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {list.map((item: any, idx: number) => {
              const colors = categoryColors[item.category] || defaultColors;
              return (
                <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-sm ${colors.bar}`}></span>
                    <span className="font-medium">{item.category}</span>
                    {item.status === "Warning" && (
                      <span className="text-[8px] bg-rose-500/20 border border-rose-500/30 text-rose-400 px-1 py-0.1 rounded font-bold">High</span>
                    )}
                    {item.status === "Invested" && (
                      <span className="text-[8px] bg-pink-500/20 border border-pink-500/30 text-pink-400 px-1 py-0.1 rounded font-bold">Asset</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">₹{item.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-white/40 ml-2 font-mono">{item.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-pink-400/90 font-medium bg-pink-500/5 border border-pink-500/10 rounded-lg p-2.5 mt-2 flex items-start gap-1.5">
            <span className="text-xs">💡</span>
            <span>Recommended: Your savings rate is excellent (49.8%), but reducing Swiggy/Zomato orders could save you an extra ₹3,400.</span>
          </div>
        </div>
      );
    }

    // Default: list bullet points if data matches nothing specific
    if (proposal.bullets && proposal.bullets.length > 0) {
      return (
        <div className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 mt-2 text-xs space-y-1.5">
          {proposal.bullets.slice(0, 5).map((bullet: string, idx: number) => (
            <div key={idx} className="text-white/80">{renderText(bullet)}</div>
          ))}
          {proposal.bullets.length > 5 && (
            <div className="text-accent-neon text-[10px] font-bold italic pt-1">
              +{proposal.bullets.length - 5} more details
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const quickPrompts = [
    { text: 'Calculate EMI for ₹5 Lakh loan', icon: '📊' },
    { text: 'Recommend a travel card', icon: '💳' },
    { text: 'Compare Fixed Deposit rates', icon: '📈' },
    { text: 'Report unauthorized transaction', icon: '🚨' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[34rem] backdrop-blur-lg bg-[#0e172f]/85 rounded-2xl shadow-glass-lg border border-white/15 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#070b18]/60">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-neon"></span>
              </span>
              <h3 className="text-white font-bold text-sm tracking-wide">Apex Assistant</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearHistory}
                title="Reset conversation"
                className="text-white/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto h-80 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-6">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-accent flex items-center justify-center text-dark-950 text-xl font-bold mx-auto shadow-neon">
                    💬
                  </div>
                  <h4 className="text-sm font-bold text-white">How can I assist you today?</h4>
                  <p className="text-xs text-white/50 max-w-[240px] leading-relaxed">
                    Ask me about personal loans, credit card suggestions, investments, or bank policies.
                  </p>
                </div>

                {/* Quick actions chips */}
                <div className="grid grid-cols-2 gap-2 w-full px-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt.text)}
                      className="p-3 text-[11px] text-left rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all duration-200 text-white/80 space-y-1"
                    >
                      <span className="text-base block">{prompt.icon}</span>
                      <span className="font-semibold block leading-tight">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id}>
                  {/* Message bubble */}
                  <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                        message.sender === 'user'
                          ? 'bg-gradient-accent text-dark-950 font-bold shadow-neon'
                          : 'bg-white/5 border border-white/10 text-white'
                      }`}
                    >
                      {message.sender === 'user' ? message.text : renderText(message.text)}
                    </div>
                  </div>
                  
                  {/* Intent Tag (For Transparency) */}
                  {message.sender === 'assistant' && message.router?.intent && (
                    <div className="flex justify-start mb-1 ml-1">
                      <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] text-purple-400 font-semibold tracking-wider uppercase">
                        AI Intent: {message.router.intent.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Custom Rich Widget Renderer */}
                  {message.sender === 'assistant' && message.proposal && (
                    <div className="flex justify-start mb-2">
                      {renderProposalWidget(message.proposal)}
                    </div>
                  )}

                  {/* Feedback Buttons */}
                  {message.sender === 'assistant' && message.showFeedback && !message.feedbackGiven && (
                    <div className="flex justify-start mb-2">
                      <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-[11px]">
                        <span className="text-white/60">Was this advice helpful?</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleFeedback(message.id, true)}
                            className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 rounded-md text-[10px] text-purple-400 font-bold transition-all"
                          >
                            👍 Yes
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, false)}
                            className="px-2.5 py-1 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 rounded-md text-[10px] text-pink-400 font-bold transition-all"
                          >
                            👎 No
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Loading typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-accent-neon rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                      <div className="w-1.5 h-1.5 bg-accent-neon rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                      <div className="w-1.5 h-1.5 bg-accent-neon rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                    </div>
                    <span className="text-[10px] text-white/50 font-semibold tracking-wider uppercase">Processing intent...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t border-white/10 bg-[#070b18]/80 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about loans, cards, or investments..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-accent-neon focus:border-accent-neon disabled:opacity-50 transition-all duration-200 text-xs"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="p-3 bg-gradient-accent text-dark-950 rounded-xl hover:shadow-neon focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-dark-950/20 border-t-dark-950 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-glass-lg backdrop-blur-lg border border-white/15 transition-all duration-300 flex items-center justify-center group ${
          isOpen 
            ? 'bg-slate-900 hover:bg-slate-800 text-white' 
            : 'bg-gradient-accent hover:shadow-neon-lg transform hover:scale-105'
        }`}
      >
        {isOpen ? (
          <svg className="w-5 h-5 text-white transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-5 h-5 text-dark-950 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

