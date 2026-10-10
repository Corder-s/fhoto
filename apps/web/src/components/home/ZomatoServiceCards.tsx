'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export const ZomatoServiceCards: React.FC = () => {
  const CATEGORY_CARDS = [
    {
      id: 'portraits',
      title: 'Portrait Photography',
      description: 'Professional portraits, headshots, and personal branding.',
      image: '/reference-assets/cat_portrait.jpg',
      href: '/explore?category=Portraits',
      count: '120+ Photographers',
    },
    {
      id: 'reels',
      title: 'Reels & Creator Shoots',
      description: 'Create high-quality content for social media and personal brands.',
      image: '/reference-assets/cat_reels.jpg',
      href: '/explore?category=Reels',
      count: '85+ Videographers',
    },
    {
      id: 'events',
      title: 'Events & Celebrations',
      description: 'Capture birthdays, celebrations, and special occasions.',
      image: '/reference-assets/cat_events.jpg',
      href: '/explore?category=Events',
      count: '150+ Event Pros',
    },
  ];

  return (
    <section className="py-10 md:py-16 bg-[#FAF7F2]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {CATEGORY_CARDS.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_4px_16px_-4px_rgba(26,24,22,0.06)] hover:shadow-elevated hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Photo Header */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#F2ECE3]">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                  {card.count}
                </div>
              </div>

              {/* Card Bottom Body */}
              <div className="p-5 sm:p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                      {card.title}
                    </h3>
                    <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E0D8CD] flex items-center justify-center text-[#1A1816] group-hover:border-[#FF6E00] group-hover:bg-[#FF6E00] group-hover:text-white transition-all shrink-0">
                      <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#665E55] leading-relaxed pt-1">
                    {card.description}
                  </p>
                </div>

                <div className="pt-2 text-xs font-bold text-[#FF6E00] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore specialists</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
