'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Camera,
  Calendar,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  suggestions?: string[];
  isConfigured?: boolean;
  confirmationRequired?: {
    action: string;
    description: string;
    params: Record<string, any>;
  };
  timestamp: string;
}

interface SnapShootAiChatWidgetProps {
  variant: 'customer' | 'photographer';
}

export const SnapShootAiChatWidget: React.FC<SnapShootAiChatWidgetProps> = ({ variant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  const isPhotographer = variant === 'photographer';

  // Automatically close chatbot on route navigation
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  // Reliable Click-Outside & Escape Key Detection
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // 1. Clicks inside the chat panel must NOT close the chatbot
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }

      // 2. Clicks on the launcher button must NOT trigger outside-close
      if (launcherRef.current && launcherRef.current.contains(target)) {
        return;
      }

      // 3. User clicked anywhere outside -> close chatbot without blocking event
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key closes the open chat panel
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Attach document-level listeners
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    // Guaranteed cleanup on close or unmount to prevent memory leaks
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const defaultSuggestions = isPhotographer
    ? [
        'Analyze my bookings & revenue',
        'Review my package pricing',
        'Why am I getting fewer bookings?',
        'What is my current subscription tier?',
      ]
    : [
        'Find wedding photographers in Delhi',
        'Check my booking status',
        'Where are my delivered photos?',
        'How does Shoot OTP work?',
      ];

  // Initial welcome message on first open
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: isPhotographer
            ? 'Hello Creator! I am your SnapShoot Business Copilot. I analyze your studio bookings, package pricing, client CRM, and SaaS subscription to help grow your photography revenue.'
            : 'Hi there! I am your SnapShoot Concierge. I can help you discover verified photographers, check shoot status, explain arrival OTPs, and find delivered photo galleries.',
          suggestions: defaultSuggestions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [variant]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Collect history context (last 6 messages)
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Retrieve token from storage if logged in
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
          : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          history,
        }),
      });

      let data: any = null;
      const textResp = await res.text();
      try {
        data = JSON.parse(textResp);
      } catch {
        throw new Error(textResp && textResp.length < 120 ? textResp : `HTTP ${res.status}`);
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response text received from AI service.',
        toolsUsed: data.toolsUsed,
        suggestions: data.suggestions || defaultSuggestions,
        isConfigured: data.isConfigured !== false,
        confirmationRequired: data.confirmationRequired,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ AI Service Note: ${err.message || 'Could not communicate with chatbot service.'}`,
        isConfigured: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          ref={launcherRef}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#FF6E00] hover:bg-[#E05D00] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 group border border-white/20"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <span className="text-sm font-semibold tracking-wide">
            {isPhotographer ? 'Studio Copilot' : 'Ask AI'}
          </span>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#FFFFFF] rounded-2xl shadow-2xl flex flex-col border border-[#E8E2D9] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-[#FAF7F2] border-b border-[#E8E2D9] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FF6E00]/10 border border-[#FF6E00]/20 flex items-center justify-center text-[#FF6E00]">
                {isPhotographer ? <TrendingUp className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1A1816]">
                    {isPhotographer ? 'Studio Business Copilot' : 'SnapShoot AI Concierge'}
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FF6E00]/10 text-[#FF6E00]">
                    Real AI
                  </span>
                </div>
                <p className="text-[11px] text-[#706B65]">
                  {isPhotographer ? 'Connected to Studio Analytics & CRM' : 'Connected to Booking & Shoot Tools'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#706B65] hover:text-[#1A1816] hover:bg-[#EFE9DF] transition-colors"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFBF9]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#FF6E00] text-white rounded-br-none shadow-sm'
                      : 'bg-[#FAF7F2] text-[#1A1816] border border-[#E8E2D9] rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Tool Call Badge if executed */}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool) => (
                        <span
                          key={tool}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1A1816]/5 text-[#1A1816] border border-[#1A1816]/10"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Tool: {tool}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.content}

                  {/* Missing Key Warning Alert Banner */}
                  {msg.isConfigured === false && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Server Configuration Notice</strong>
                        <span>
                          To activate dynamic Gemini completions, provide <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> in the backend server environment.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Confirmation Required Action Card */}
                  {msg.confirmationRequired && (
                    <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-orange-900 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span>Action Safeguard: {msg.confirmationRequired.action}</span>
                      </div>
                      <p className="text-orange-800 mb-2.5">{msg.confirmationRequired.description}</p>
                      <button
                        onClick={() => handleSendMessage(`CONFIRM ${msg.confirmationRequired?.action}`)}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#FF6E00] hover:bg-[#E05D00] text-white font-semibold text-xs transition-colors"
                      >
                        Confirm Action
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-[#A39E96] mt-1 px-1">{msg.timestamp}</span>

                {/* Suggestions Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#FF6E00] hover:text-white text-[#706B65] border border-[#E8E2D9] transition-all text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#706B65] p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6E00] animate-spin" />
                <span>AI is consulting SnapShoot tools & generating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#FFFFFF] border-t border-[#E8E2D9]">
            <div className="flex items-center gap-2 bg-[#FAF7F2] rounded-xl px-3 py-2 border border-[#E8E2D9] focus-within:border-[#FF6E00] focus-within:ring-1 focus-within:ring-[#FF6E00] transition-all">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isPhotographer
                    ? 'Ask about packages, bookings, revenue...'
                    : 'Ask about photographers, shoot OTP, status...'
                }
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#1A1816] placeholder-[#A39E96] outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="p-1.5 rounded-lg bg-[#FF6E00] hover:bg-[#E05D00] disabled:bg-[#E8E2D9] text-white disabled:text-[#A39E96] transition-colors"
                aria-label="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#A39E96] px-1">
              <span>Powered by Google Gemini & SnapShoot Tools</span>
              <span>Enter to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
