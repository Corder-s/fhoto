'use client';

import React, { useState } from 'react';
import {
  MapPin,
  LayoutGrid,
  Calendar,
  Clock,
  Search,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';

export interface SearchFilters {
  location: string;
  category: string;
  date: string;
  duration: string;
}

interface HeroSearchProps {
  onSearch: (filters: SearchFilters) => void;
  selectedCategory?: string;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch, selectedCategory = 'Portraits' }) => {
  const [location, setLocation] = useState('Greater Noida, UP');
  const [category, setCategory] = useState(selectedCategory || 'Portraits');
  const [date, setDate] = useState('Oct 25, 2026');
  const [duration, setDuration] = useState('2 Hours');

  // Dropdown visibility
  const [openDropdown, setOpenDropdown] = useState<'none' | 'location' | 'category' | 'date' | 'duration'>('none');

  React.useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      const formatted = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
      setCategory(formatted);
    }
  }, [selectedCategory]);

  const locationsList = ['Greater Noida, UP', 'Noida, UP', 'Delhi NCR', 'Gurugram', 'South Delhi'];
  const categoriesList = ['Portraits', 'Reels', 'Couples', 'Events'];
  const datesList = ['Oct 25, 2026', 'Today', 'Tomorrow', 'This Weekend', 'Nov 01, 2026'];
  const durationsList = ['1 Hour', '2 Hours', '3 Hours', '4 Hours Half-Day'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenDropdown('none');
    onSearch({
      location,
      category: category.toLowerCase(),
      date,
      duration,
    });
  };

  return (
    <div className="w-full flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 pt-2">
      {/* 1. SEARCH BAR */}
      {openDropdown !== 'none' && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setOpenDropdown('none')}
        />
      )}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl md:rounded-full border border-[#E8E2D8] shadow-[0_4px_20px_-4px_rgba(26,24,22,0.06)] p-2 md:py-2 md:px-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-0 max-w-full xl:max-w-[700px] flex-1 z-50"
      >
        {/* Location Dropdown */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'location' ? 'none' : 'location')}
            className="w-full px-3 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-[#FAF7F2] rounded-xl md:rounded-full transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-[#FF6E00] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-[#8C847A] leading-tight">
                  Location
                </span>
                <span className="block text-xs font-bold text-[#1A1816] truncate">
                  {location}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C847A] shrink-0 ml-1" />
          </button>

          {openDropdown === 'location' && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#E8E2D8] rounded-xl shadow-elevated py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {locationsList.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setLocation(loc);
                    setOpenDropdown('none');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-7 w-[1px] bg-[#E8E2D8] mx-0.5 shrink-0" />

        {/* Shoot Type Dropdown */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'category' ? 'none' : 'category')}
            className="w-full px-3 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-[#FAF7F2] rounded-xl md:rounded-full transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutGrid className="w-4 h-4 text-[#FF6E00] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-[#8C847A] leading-tight">
                  Shoot type
                </span>
                <span className="block text-xs font-bold text-[#1A1816] truncate">
                  {category}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C847A] shrink-0 ml-1" />
          </button>

          {openDropdown === 'category' && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-[#E8E2D8] rounded-xl shadow-elevated py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setOpenDropdown('none');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-7 w-[1px] bg-[#E8E2D8] mx-0.5 shrink-0" />

        {/* Date Dropdown */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'date' ? 'none' : 'date')}
            className="w-full px-3 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-[#FAF7F2] rounded-xl md:rounded-full transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar className="w-4 h-4 text-[#FF6E00] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-[#8C847A] leading-tight">
                  Date
                </span>
                <span className="block text-xs font-bold text-[#1A1816] truncate">
                  {date}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C847A] shrink-0 ml-1" />
          </button>

          {openDropdown === 'date' && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-[#E8E2D8] rounded-xl shadow-elevated py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {datesList.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDate(d);
                    setOpenDropdown('none');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-7 w-[1px] bg-[#E8E2D8] mx-0.5 shrink-0" />

        {/* Duration Dropdown */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'duration' ? 'none' : 'duration')}
            className="w-full px-3 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-[#FAF7F2] rounded-xl md:rounded-full transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock className="w-4 h-4 text-[#FF6E00] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-[#8C847A] leading-tight">
                  Duration
                </span>
                <span className="block text-xs font-bold text-[#1A1816] truncate">
                  {duration}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C847A] shrink-0 ml-1" />
          </button>

          {openDropdown === 'duration' && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#E8E2D8] rounded-xl shadow-elevated py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {durationsList.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => {
                    setDuration(dur);
                    setOpenDropdown('none');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1A1816] hover:bg-[#FAF7F2] transition-colors"
                >
                  {dur}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Orange Button */}
        <button
          type="submit"
          className="w-11 h-11 rounded-xl md:rounded-full bg-[#FF6E00] hover:bg-[#E86300] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-sm transition-all ml-1 self-center"
          aria-label="Search"
        >
          <Search className="w-4 h-4 stroke-[2.8]" />
        </button>
      </form>

      {/* 2. TRUST INDICATORS (Directly on the right of the search bar) */}
      <div className="flex items-center justify-start xl:justify-end gap-6 sm:gap-8 pt-1 xl:pt-0">
        {/* Trust 1: Verified */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-[#D5CEC4] flex items-center justify-center text-[#5A544D] bg-[#FAF7F2] shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#5A544D] stroke-[2]" />
          </div>
          <div className="text-[11px] leading-tight text-[#1A1816]">
            <span className="font-bold block">Verified</span>
            <span className="text-[#78716A]">photographers</span>
          </div>
        </div>

        {/* Trust 2: Secure */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-[#D5CEC4] flex items-center justify-center text-[#5A544D] bg-[#FAF7F2] shrink-0">
            <CreditCard className="w-4 h-4 text-[#5A544D] stroke-[2]" />
          </div>
          <div className="text-[11px] leading-tight text-[#1A1816]">
            <span className="font-bold block">Secure</span>
            <span className="text-[#78716A]">booking & payments</span>
          </div>
        </div>

        {/* Trust 3: High-quality */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-[#D5CEC4] flex items-center justify-center text-[#5A544D] bg-[#FAF7F2] shrink-0">
            <ImageIcon className="w-4 h-4 text-[#5A544D] stroke-[2]" />
          </div>
          <div className="text-[11px] leading-tight text-[#1A1816]">
            <span className="font-bold block">High-quality</span>
            <span className="text-[#78716A]">photos delivered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
