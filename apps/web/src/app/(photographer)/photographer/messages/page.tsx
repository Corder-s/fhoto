'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Send, Calendar, CheckCircle2, Phone, User, ArrowRight } from 'lucide-react';

interface ChatItem {
  id: string;
  sender: 'client' | 'photographer';
  text: string;
  time: string;
}

export default function PhotographerMessagesPage() {
  const [activeClient, setActiveClient] = useState<'shubham' | 'rohan'>('shubham');
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState<Record<string, ChatItem[]>>({
    shubham: [
      {
        id: '1',
        sender: 'photographer',
        text: 'Namaste Shubham! I have confirmed your session booking. Please share the exact venue address.',
        time: '09:15 AM',
      },
      {
        id: '2',
        sender: 'client',
        text: 'Hi Vikram! We are shooting at Lodhi Gardens near the central glasshouse.',
        time: '09:20 AM',
      },
    ],
    rohan: [
      {
        id: '1',
        sender: 'client',
        text: 'Hi, are you available next Saturday for an evening anniversary party?',
        time: 'Yesterday',
      },
    ],
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatItem = {
      id: String(Date.now()),
      sender: 'photographer',
      text: inputText.trim(),
      time: 'Just now',
    };

    setConversations((prev) => ({
      ...prev,
      [activeClient]: [...(prev[activeClient] || []), newMsg],
    }));
    setInputText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6E00]">
            Studio Messenger
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight">
            Client Communications
          </h1>
          <p className="text-xs sm:text-sm text-[#5A544D] mt-1">
            Coordinate shoot requirements, discuss photo framing, and answer client inquiries.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E1D6] overflow-hidden shadow-card grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
        {/* Left Client List */}
        <div className="md:col-span-4 border-r border-[#E8E1D6] p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C847A] px-2">Booked Clients</h2>

          <button
            onClick={() => setActiveClient('shubham')}
            className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
              activeClient === 'shubham' ? 'bg-[#FFF3E5] border border-[#FFD4A8]' : 'hover:bg-[#FAF7F2]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#1A1816] text-white flex items-center justify-center font-bold text-xs shrink-0">
              SS
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#1A1816] truncate">Shubham Saini</span>
                <span className="text-[10px] text-[#8C847A]">09:20 AM</span>
              </div>
              <p className="text-[11px] text-[#5A544D] truncate mt-0.5">
                Hi Vikram! We are shooting at Lodhi...
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveClient('rohan')}
            className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
              activeClient === 'rohan' ? 'bg-[#FFF3E5] border border-[#FFD4A8]' : 'hover:bg-[#FAF7F2]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#E5DDD2] text-[#1A1816] flex items-center justify-center font-bold text-xs shrink-0">
              RM
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#1A1816] truncate">Rohan Malhotra</span>
                <span className="text-[10px] text-[#8C847A]">Yesterday</span>
              </div>
              <p className="text-[11px] text-[#5A544D] truncate mt-0.5">
                Hi, are you available next Saturday...
              </p>
            </div>
          </button>
        </div>

        {/* Right Conversation Window */}
        <div className="md:col-span-8 flex flex-col justify-between p-6 bg-[#FAF7F2]/40">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D6]">
            <div>
              <h3 className="text-sm font-black text-[#1A1816]">
                {activeClient === 'shubham' ? 'Shubham Saini' : 'Rohan Malhotra'}
              </h3>
              <span className="text-[11px] text-[#FF6E00] font-bold">
                Booking #BK-2026-9041 • Confirmed Shoot
              </span>
            </div>

            <Link
              href="/photographer/bookings"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E1D6] text-xs font-bold text-[#1A1816] transition-all"
            >
              View Booking Order →
            </Link>
          </div>

          <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[380px]">
            {(conversations[activeClient] || []).map((msg) => {
              const isCreator = msg.sender === 'photographer';
              return (
                <div key={msg.id} className={`flex ${isCreator ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isCreator
                        ? 'bg-[#FF6E00] text-white rounded-br-none shadow-sm'
                        : 'bg-white text-[#1A1816] border border-[#E8E1D6] rounded-bl-none shadow-2xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className={`block text-[10px] mt-1 ${isCreator ? 'text-white/80 text-right' : 'text-[#8C847A]'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="pt-4 border-t border-[#E8E1D6] flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Reply to client regarding session instructions..."
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
