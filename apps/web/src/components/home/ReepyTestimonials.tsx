'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  initial: string;
}

export const ReepyTestimonials: React.FC = () => {
  const testimonials: TestimonialItem[] = [
    {
      id: 'test-1',
      quote:
        '"REEPY connected me with a reel photographer in my area who completely transformed my Instagram. My engagement went up 5x in two months. The booking process was so easy!"',
      authorName: 'Riya Sharma',
      authorRole: 'Beauty Influencer, Mumbai',
      initial: 'R',
    },
    {
      id: 'test-2',
      quote:
        '"Found a food photographer near my cafe through REEPY. The menu photos she shot doubled our online orders. This platform is a game-changer for small businesses."',
      authorName: 'Ankit Verma',
      authorRole: 'Restaurant Owner, Bengaluru',
      initial: 'A',
    },
    {
      id: 'test-3',
      quote:
        '"We were planning our wedding and needed a photographer who knew our locality. REEPY made it effortless to find, compare, and book the perfect person. Highly recommend!"',
      authorName: 'Sonia Gupta',
      authorRole: 'Bride, Delhi',
      initial: 'S',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-t border-b border-[#E7EAEE]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs sm:text-sm font-black tracking-wider text-[#14B8A6] uppercase">
            SUCCESS STORIES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#191C22] tracking-tight">
            Loved by creators and brands
          </h2>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="bg-[#F8FAFC] rounded-3xl border border-[#E7EAEE] p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* Teal Double Quote 99 */}
                <div className="text-[#14B8A6] font-black text-3xl font-serif select-none">
                  ““
                </div>

                {/* Quote Text */}
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                  {item.quote}
                </p>

                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-amber-400 pt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-6 mt-4 border-t border-[#E7EAEE]/60">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white font-black text-sm flex items-center justify-center shrink-0">
                  {item.initial}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#191C22]">
                    {item.authorName}
                  </h4>
                  <p className="text-xs text-[#64748B]">
                    {item.authorRole}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
