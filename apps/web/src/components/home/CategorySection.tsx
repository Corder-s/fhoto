'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ArrowUpRight, ArrowRight } from 'lucide-react';
import { SAMPLE_CATEGORIES, PhotographyCategory } from '../../data/categories';

interface CategorySectionProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const [activeFilter, setActiveFilter] = useState('portraits');

  const filterTabs = [
    { label: 'Portraits', slug: 'portraits' },
    { label: 'Reels', slug: 'reels' },
    { label: 'Couples', slug: 'couples' },
    { label: 'Events', slug: 'events' },
  ];

  const handleTabClick = (slug: string) => {
    setActiveFilter(slug);
    onSelectCategory(slug);
  };

  return (
    <section className="py-10 md:py-16 bg-[#FAF7F2]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C847A]">
            EXPLORE BY CATEGORY
          </span>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#1A1816] tracking-tight">
              Capture more than a moment.
            </h2>

            {/* Category Selector Pills + View all link */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-[#F2ECE3]/70 rounded-full border border-[#E8E1D6]">
                {filterTabs.map((tab) => {
                  const isActive = activeFilter === tab.slug;
                  return (
                    <button
                      key={tab.slug}
                      onClick={() => handleTabClick(tab.slug)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#FF6E00] text-white shadow-sm'
                          : 'text-[#5A544D] hover:text-[#1A1816] hover:bg-[#EAE1D4]/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <Link
                href="/categories"
                className="text-xs font-bold text-[#1A1816] hover:text-[#FF6E00] flex items-center gap-1 ml-2 transition-colors"
              >
                <span>View all categories</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Portrait Session */}
          <div
            onClick={() => handleTabClick('portraits')}
            className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_2px_10px_-2px_rgba(26,24,22,0.04)] hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="aspect-[16/11] overflow-hidden bg-[#FAF7F2]">
                <img
                  src="/reference-assets/cat_portrait.jpg"
                  alt="Portrait Session"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3.5 space-y-0.5">
                <h3 className="text-sm font-bold text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                  Portrait Session
                </h3>
                <p className="text-[10px] text-[#8C847A] truncate">
                  Individual · Professional · Lifestyle
                </p>
              </div>
            </div>

            <div className="p-3.5 pt-0 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#1A1816]">
                <Star className="w-3 h-3 text-[#FF6E00] fill-[#FF6E00]" />
                <span>4.9</span>
                <span className="text-[#8C847A] font-normal">(320)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#1A1816]">₹800</span>
                <div className="w-6 h-6 rounded-full bg-white border border-[#E0D8CD] flex items-center justify-center text-[#1A1816] group-hover:border-[#FF6E00] group-hover:text-[#FF6E00] shadow-sm transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Creator Reels */}
          <div
            onClick={() => handleTabClick('reels')}
            className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_2px_10px_-2px_rgba(26,24,22,0.04)] hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="aspect-[16/11] overflow-hidden bg-[#FAF7F2]">
                <img
                  src="/reference-assets/cat_reels.jpg"
                  alt="Creator Reels"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3.5 space-y-0.5">
                <h3 className="text-sm font-bold text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                  Creator Reels
                </h3>
                <p className="text-[10px] text-[#8C847A] truncate">
                  Social media · Content · Personal brand
                </p>
              </div>
            </div>

            <div className="p-3.5 pt-0 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#1A1816]">
                <Star className="w-3 h-3 text-[#FF6E00] fill-[#FF6E00]" />
                <span>4.8</span>
                <span className="text-[#8C847A] font-normal">(210)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#1A1816]">₹1,200</span>
                <div className="w-6 h-6 rounded-full bg-white border border-[#E0D8CD] flex items-center justify-center text-[#1A1816] group-hover:border-[#FF6E00] group-hover:text-[#FF6E00] shadow-sm transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Couple Shoot */}
          <div
            onClick={() => handleTabClick('couples')}
            className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_2px_10px_-2px_rgba(26,24,22,0.04)] hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="aspect-[16/11] overflow-hidden bg-[#FAF7F2]">
                <img
                  src="/reference-assets/cat_couple.jpg"
                  alt="Couple Shoot"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3.5 space-y-0.5">
                <h3 className="text-sm font-bold text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                  Couple Shoot
                </h3>
                <p className="text-[10px] text-[#8C847A] truncate">
                  Pre-weddings · Love stories · Engagements
                </p>
              </div>
            </div>

            <div className="p-3.5 pt-0 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#1A1816]">
                <Star className="w-3 h-3 text-[#FF6E00] fill-[#FF6E00]" />
                <span>4.9</span>
                <span className="text-[#8C847A] font-normal">(412)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#1A1816]">₹1,500</span>
                <div className="w-6 h-6 rounded-full bg-white border border-[#E0D8CD] flex items-center justify-center text-[#1A1816] group-hover:border-[#FF6E00] group-hover:text-[#FF6E00] shadow-sm transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Events */}
          <div
            onClick={() => handleTabClick('events')}
            className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden shadow-[0_2px_10px_-2px_rgba(26,24,22,0.04)] hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="aspect-[16/11] overflow-hidden bg-[#FAF7F2]">
                <img
                  src="/reference-assets/cat_events.jpg"
                  alt="Events"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3.5 space-y-0.5">
                <h3 className="text-sm font-bold text-[#1A1816] group-hover:text-[#FF6E00] transition-colors">
                  Events
                </h3>
                <p className="text-[10px] text-[#8C847A] truncate">
                  Weddings · Parties · Corporate
                </p>
              </div>
            </div>

            <div className="p-3.5 pt-0 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#1A1816]">
                <Star className="w-3 h-3 text-[#FF6E00] fill-[#FF6E00]" />
                <span>4.8</span>
                <span className="text-[#8C847A] font-normal">(189)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#1A1816]">₹2,500</span>
                <div className="w-6 h-6 rounded-full bg-white border border-[#E0D8CD] flex items-center justify-center text-[#1A1816] group-hover:border-[#FF6E00] group-hover:text-[#FF6E00] shadow-sm transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Orange Promotional Card */}
          <Link
            href="/explore"
            className="relative bg-[#FF6E00] rounded-2xl p-4 text-white overflow-hidden shadow-[0_4px_16px_-2px_rgba(255,110,0,0.3)] hover:shadow-[0_8px_24px_-2px_rgba(255,110,0,0.4)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
          >
            {/* Top Text Content */}
            <div className="space-y-3 z-10">
              <h3 className="text-lg sm:text-xl font-black leading-tight text-white tracking-tight">
                Your next <br />
                great shoot <br />
                starts here.
              </h3>
              <p className="text-[10px] leading-relaxed text-white/90 font-medium">
                Verified photographers. <br />
                Stunning stories. <br />
                All in one place.
              </p>
            </div>

            {/* Bottom Camera Image & Arrow Button */}
            <div className="relative pt-6 flex items-end justify-between z-10">
              <div className="w-24 h-18 overflow-hidden drop-shadow-md group-hover:scale-105 transition-transform duration-300 -ml-2 -mb-2">
                <img
                  src="/reference-assets/cat_promo_camera.png"
                  alt="Professional Camera"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#FF6E00] shadow-md group-hover:scale-110 transition-transform shrink-0">
                <ArrowUpRight className="w-4 h-4 stroke-[2.8]" />
              </div>
            </div>

            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </Link>
        </div>
      </div>
    </section>
  );
};
