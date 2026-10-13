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

interface ChatDockProps {
  user?: any;
}

export default function ChatDock({ user = null }: ChatDockProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (user === null) {
      setMessages([]);
      if (typeof window !== 'undefined') {
        const newSid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chat_session_id', newSid);
        setSessionId(newSid);
      }
    }
  }, [user]);

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
          text: data.reply || 'Your BankingAI financial advisor has reviewed your request.',
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
          text: 'BankingAI assistant is processing updates. Please try again shortly.',
          sender: 'assistant'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'The backend service on port 8000 is currently offline. Start the backend with uvicorn or docker to chat with live LLM routing.',
        sender: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
      await fetch(`${API_BASE}/chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          helpful: true
        })
      }).catch(() => null);

      setMessages([]);
      const newSid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chat_session_id', newSid);
      }
      setSessionId(newSid);
    } catch (error) {
      console.error('Failed to reset chat:', error);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch(`${API_BASE}/chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          helpful: helpful
        })
      }).catch(() => null);

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, feedbackGiven: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  };

  const renderText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <span className="whitespace-pre-line leading-relaxed">
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </span>
    );
  };

  // Classic Light Mode Proposal Widgets
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
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 mt-2 space-y-3.5 shadow-sm text-slate-800 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Loan EMI Estimate</p>
              <h4 className="text-xl font-serif font-bold text-slate-900">₹{Math.round(data.emi).toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-sans font-normal"> / month</span></h4>
            </div>
            <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 font-medium px-2 py-0.5 rounded">
              Verified Quote
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full bg-slate-800" style={{ width: `${100 - interestPercentage}%` }}></div>
              <div className="h-full bg-amber-500" style={{ width: `${interestPercentage}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span> Principal ({Math.round(100 - interestPercentage)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Interest ({Math.round(interestPercentage)}%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div>
              <p className="text-slate-500 text-[9px] uppercase font-mono">Principal</p>
              <p className="font-semibold font-mono text-slate-900">₹{Math.round(principal).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[9px] uppercase font-mono">Interest Rate</p>
              <p className="font-semibold font-mono text-emerald-700">{data.rate}% p.a.</p>
            </div>
            <div>
              <p className="text-slate-500 text-[9px] uppercase font-mono">Tenure</p>
              <p className="font-medium text-slate-800">{data.tenure} months</p>
            </div>
            <div>
              <p className="text-slate-500 text-[9px] uppercase font-mono">Total Payable</p>
              <p className="font-semibold font-mono text-slate-900">₹{Math.round(totalPayment).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      );
    }

    // 2. Credit Card Recommendation Widget
    if (data.recommended_card !== undefined) {
      const details = data.card_details || {};

      return (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 mt-2 space-y-3.5 shadow-sm text-slate-800 font-sans">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Recommended Card</p>
          
          <div className="w-full h-36 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-md text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-serif font-bold text-amber-300 tracking-wider uppercase">{details.name || 'Apex Noir Centurion'}</p>
                <p className="text-[9px] text-slate-300">Priority Selection</p>
              </div>
              <div className="w-7 h-5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-sm"></div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-mono text-sm tracking-widest text-slate-100">•••• •••• •••• 9823</p>
                <p className="text-[8px] text-amber-300/90 uppercase font-mono tracking-wider mt-0.5">Complimentary Airport Lounge & Rewards</p>
              </div>
              <div className="text-[9px] text-slate-300 font-mono">EXP: 12/30</div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Card Privileges</p>
            <ul className="text-xs space-y-1 text-slate-700">
              {(details.benefits || [
                "5X Points on Travel and Bookings",
                "Complimentary Airport Lounge Access",
                "Comprehensive Travel Shield Protection"
              ]).slice(0, 3).map((benefit: string, idx: number) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-amber-600 text-xs font-bold">✓</span> {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between text-xs pt-2.5 border-t border-slate-100 text-slate-600 font-mono">
            <span>Annual Fee: <strong className="text-slate-900">₹{(details.annual_fee || 0).toLocaleString('en-IN')}</strong></span>
            <span>Reward Multiplier: <strong className="text-amber-700">{details.reward_rate || 5}X</strong></span>
          </div>
        </div>
      );
    }

    // 3. Fixed Deposit Ladder Widget
    if (data.ladder !== undefined) {
      return (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 mt-2 space-y-3.5 shadow-sm text-slate-800 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Term Deposit Strategy</p>
              <h4 className="text-base font-serif font-bold text-slate-900">₹{(data.total_investment || 0).toLocaleString('en-IN')} Split</h4>
            </div>
            <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium px-2 py-0.5 rounded">
              Yield Optimized
            </span>
          </div>

          <div className="space-y-1.5">
            {(data.ladder || []).map((fd: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
                <div>
                  <p className="font-semibold text-slate-900">₹{Math.round(fd.amount).toLocaleString('en-IN')}</p>
                  <p className="text-[9px] text-slate-500 font-mono">Tenure: {fd.tenure} months</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700 font-mono">{fd.rate}% p.a.</p>
                  <p className="text-[9px] text-slate-500 font-mono">Maturity: ₹{Math.round(fd.maturity_amount).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600 font-mono">
            <div>
              <p className="text-[9px] uppercase">Effective Rate</p>
              <p className="font-semibold text-emerald-700">{data.effective_rate}%</p>
            </div>
            <div>
              <p className="text-[9px] uppercase">Net Interest Earned</p>
              <p className="font-semibold text-amber-700">₹{Math.round(data.total_interest).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      );
    }

    // 4. Forex Conversion Widget
    if (data.currency !== undefined && data.exchange_rate !== undefined) {
      return (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 mt-2 space-y-3.5 shadow-sm text-slate-800 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Foreign Exchange Quote</p>
              <h4 className="text-base font-serif font-bold text-slate-900">
                ₹{Math.round(data.inr_amount).toLocaleString('en-IN')} → {data.foreign_amount.toLocaleString()} {data.currency}
              </h4>
            </div>
            <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded">
              Live Interbank
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700">
            <div>
              <p className="text-slate-500 text-[9px] uppercase">Cash Rate</p>
              <p className="font-semibold text-slate-900">1 {data.currency} = ₹{data.exchange_rate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[9px] uppercase">Forex Card Rate</p>
              <p className="font-semibold text-emerald-700">1 {data.currency} = ₹{data.card_rate.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 flex justify-between items-center pt-2 border-t border-slate-100">
            <span>Market quote: {data.last_updated}</span>
            <span className="text-amber-800 font-medium">Valid for 15 mins</span>
          </div>
        </div>
      );
    }

    // Default bullet points
    if (proposal.bullets && proposal.bullets.length > 0) {
      return (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-3 mt-2 text-xs space-y-1.5 text-slate-700 shadow-sm">
          {proposal.bullets.slice(0, 5).map((bullet: string, idx: number) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>{renderText(bullet)}</span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const quickPrompts = [
    { text: 'Calculate EMI for a personal loan', icon: '📊' },
    { text: 'Recommend card benefits', icon: '💳' },
    { text: 'Compare fixed deposit rates', icon: '📈' },
    { text: 'Compare investment options', icon: '🏦' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Concierge Window */}
      {isOpen && (
        <div className="mb-4 w-96 md:w-[26rem] h-[35rem] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in slide-in-from-bottom-2 duration-200">
          {/* Subtle gold accent top line */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>

          {/* Concierge Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg border border-amber-300 bg-amber-100 text-amber-800 font-serif font-bold text-sm flex items-center justify-center">
                B
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-slate-900 font-serif font-bold text-sm">BankingAI Advisor</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Smart Financial Assistant • 24/7 Support
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleClearHistory}
                title="Reset conversation"
                className="text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-all text-xs"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-200/60 transition-all"
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-50/50 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-5 py-4">
                <div className="space-y-1.5">
                  <div className="w-11 h-11 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-lg flex items-center justify-center mx-auto mb-2">
                    💬
                  </div>
                  <h4 className="text-sm font-serif font-bold text-slate-900">How can BankingAI help today?</h4>
                  <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
                    Ask questions about personal loans, credit card recommendations, investments, or bank policies.
                  </p>
                </div>

                {/* Quick actions chips */}
                <div className="grid grid-cols-1 gap-2 w-full px-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt.text)}
                      className="p-2.5 text-xs text-left rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all text-slate-700 hover:text-slate-900 flex items-center gap-2.5 shadow-sm"
                    >
                      <span className="text-sm">{prompt.icon}</span>
                      <span className="font-medium text-[11px]">{prompt.text}</span>
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
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                        message.sender === 'user'
                          ? 'bg-slate-900 text-white font-medium shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                      }`}
                    >
                      {message.sender === 'user' ? message.text : renderText(message.text)}
                    </div>
                  </div>
                  
                  {/* Category pill */}
                  {message.sender === 'assistant' && message.router?.intent && (
                    <div className="flex justify-start mb-1 ml-1">
                      <span className="px-2 py-0.5 rounded text-[9px] text-slate-400 font-mono tracking-wider uppercase">
                        Ref: {message.router.intent.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Rich widget */}
                  {message.sender === 'assistant' && message.proposal && (
                    <div className="flex justify-start mb-2">
                      {renderProposalWidget(message.proposal)}
                    </div>
                  )}

                  {/* Feedback question */}
                  {message.sender === 'assistant' && message.showFeedback && !message.feedbackGiven && (
                    <div className="flex justify-start mb-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 shadow-xs">
                        <span>Was this advice helpful?</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleFeedback(message.id, true)}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, false)}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
                          >
                            No
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
                <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Consulting BankingAI tools...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask BankingAI anything..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white text-xs transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors text-xs flex items-center justify-center shadow-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Concierge Launcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3 rounded-full shadow-lg border transition-all flex items-center gap-2.5 group ${
          isOpen 
            ? 'bg-slate-900 border-slate-800 text-white' 
            : 'bg-white border-slate-300 text-slate-800 hover:border-amber-500 hover:bg-slate-50'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs font-serif font-bold tracking-wide">
          {isOpen ? 'Close Assistant' : 'BankingAI Assistant'}
        </span>
        <span className="text-xs">💬</span>
      </button>
    </div>
  );
}
