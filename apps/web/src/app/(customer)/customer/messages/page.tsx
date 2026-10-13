'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Send, User, CheckCircle2, Phone, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../lib/auth';

interface ChatMessage {
  id: string;
  sender: 'customer' | 'creator';
  text: string;
  time: string;
}

export default function CustomerMessagesPage() {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<'vikram' | 'aman'>('vikram');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    vikram: [
      {
        id: '1',
        sender: 'creator',
        text: 'Namaste! Looking forward to your upcoming shoot. Please let me know your preferred starting location.',
        time: '10:30 AM',
      },
      {
        id: '2',
        sender: 'customer',
        text: 'Hi Vikram! We would love to capture golden hour shots near the heritage fortress courtyard.',
        time: '10:35 AM',
      },
      {
        id: '3',
        sender: 'creator',
        text: 'Perfect! I will carry the Hasselblad and prime lenses for stunning natural bokeh.',
        time: '10:40 AM',
      },
    ],
    aman: [
      {
        id: '1',
        sender: 'creator',
        text: 'Hello! Your photo gallery color grading is complete and ready for download.',
        time: 'Yesterday',
      },
    ],
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'customer',
      text: inputMessage.trim(),
      time: 'Just now',
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMsg],
    }));
    setInputMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#FF6E00]">
          Communications
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
          Messages with Photographers
        </h1>
        <p className="text-xs sm:text-sm text-[#5A544D] mt-1">
          Coordinate shoot logistics, share mood boards, and clarify details directly with your booked creatives.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E1D6] overflow-hidden shadow-subtle grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
        {/* Left: Chat list */}
        <div className="md:col-span-4 border-r border-[#E8E1D6] p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C847A] px-2">Active Conversations</h2>

          <button
            onClick={() => setActiveChat('vikram')}
            className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
              activeChat === 'vikram' ? 'bg-[#FFF3E5] border border-[#FFD4A8]' : 'hover:bg-[#FAF7F2]'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
              alt="Vikramaditya"
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#1A1816] truncate">Vikramaditya Rathore</span>
                <span className="text-[10px] text-[#8C847A]">10:40 AM</span>
              </div>
              <p className="text-[11px] text-[#5A544D] truncate mt-0.5">
                Perfect! I will carry the Hasselblad...
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveChat('aman')}
            className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
              activeChat === 'aman' ? 'bg-[#FFF3E5] border border-[#FFD4A8]' : 'hover:bg-[#FAF7F2]'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/reference-assets/avatar_aman.jpg"
              alt="Aman"
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#1A1816] truncate">Aman Verma</span>
                <span className="text-[10px] text-[#8C847A]">Yesterday</span>
              </div>
              <p className="text-[11px] text-[#5A544D] truncate mt-0.5">
                Hello! Your photo gallery color grading...
              </p>
            </div>
          </button>
        </div>

        {/* Right: Message Window */}
        <div className="md:col-span-8 flex flex-col justify-between p-6 bg-[#FAF7F2]/40">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D6]">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  activeChat === 'vikram'
                    ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
                    : '/reference-assets/avatar_aman.jpg'
                }
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-[#E8E1D6]"
              />
              <div>
                <h3 className="text-sm font-black text-[#1A1816]">
                  {activeChat === 'vikram' ? 'Vikramaditya Rathore' : 'Aman Verma'}
                </h3>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verified Pro Photographer
                </span>
              </div>
            </div>

            <Link
              href={activeChat === 'vikram' ? '/photographers/pro-vikram' : '/photographers/pro-aman'}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E1D6] text-xs font-bold text-[#1A1816] transition-all flex items-center gap-1"
            >
              <span>View Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[380px]">
            {(messages[activeChat] || []).map((m) => {
              const isMe = m.sender === 'customer';
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#FF6E00] text-white rounded-br-none shadow-sm'
                        : 'bg-white text-[#1A1816] border border-[#E8E1D6] rounded-bl-none shadow-2xs'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className={`block text-[10px] mt-1 ${isMe ? 'text-white/80 text-right' : 'text-[#8C847A]'}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="pt-4 border-t border-[#E8E1D6] flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message about shoot logistics..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E8E1D6] text-xs sm:text-sm focus:outline-none focus:border-[#FF6E00]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#FF6E00] hover:bg-[#E86300] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
