'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useAuthModal } from '../auth/AuthModalContext';

interface LiveCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  href: string;
}

export const ZomatoServiceCards: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (isMounted && data.categories && data.categories.length > 0) {
          setCategories(data.categories.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackCategories: LiveCategory[] = [
    {
      id: 'wedding-photography',
      name: 'Wedding Photography',
      slug: 'wedding-photography',
      description: 'Complete wedding celebration coverage, pheras, candid moments, and bridal portraits.',
      image: '/reference-assets/cat_events.jpg',
      href: '/explore?category=Wedding%20Photography',
    },
    {
      id: 'videography-reels',
      name: 'Videography & Reels',
      slug: 'videography-reels',
      description: 'Trending 4K vertical Instagram reels, event highlight reels, and video coverage.',
      image: '/reference-assets/cat_reels.jpg',
      href: '/explore?category=Videography%20%26%20Reels',
    },
    {
      id: 'pre-wedding-shoots',
      name: 'Pre-Wedding Shoots',
      slug: 'pre-wedding-shoots',
      description: 'Cinematic couple stories, destination visuals, and creative portraits.',
      image: '/reference-assets/aman_c1.jpg',
      href: '/explore?category=Pre-Wedding%20Shoots',
    },
  ];

  const displayedCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <section className="py-10 md:py-16 bg-[#FAF7F2]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
              FEATURED CATEGORIES
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1816]">
              Top booked creative services
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-xs font-bold text-[#FF6E00] hover:underline"
          >
            Explore all services →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {displayedCategories.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  openAuthModal({
                    returnUrl: card.href,
                    message: `Join SnapShoot to discover and book top ${card.name} specialists.`,
                  });
                }
              }}
              className="group bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_4px_16px_-4px_rgba(26,24,22,0.06)] hover:shadow-elevated hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Photo Header */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#F2ECE3]">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1A1816]/75 text-white backdrop-blur-sm">
                  Verified Category
                </div>
              </div>

              {/* Card Bottom Body */}
              <div className="p-5 sm:p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                      {card.name}
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
