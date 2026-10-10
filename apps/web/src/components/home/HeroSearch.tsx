'use client';

import React, { useState } from 'react';
import { MapPin, Camera, Calendar, Clock, Search, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

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

export const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch, selectedCategory = 'all' }) => {
  const [location, setLocation] = useState('Delhi NCR');
  const [category, setCategory] = useState(selectedCategory);
  const [date, setDate] = useState('2026-10-15');
  const [duration, setDuration] = useState('2');
  const [validationError, setValidationError] = useState('');

  // Sync if parent updates selectedCategory
  React.useEffect(() => {
    if (selectedCategory) {
      setCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setValidationError('Please enter a preferred location or city.');
      return;
    }
    setValidationError('');
    onSearch({ location, category, date, duration });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-3 sm:p-4 rounded-card-lg shadow-card border border-contour-subtle transition-all"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Location Field */}
          <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle/80 hover:border-brand focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
            <label htmlFor="search-location" className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted">
              Where
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <MapPin className="w-4 h-4 text-brand shrink-0" />
              <input
                id="search-location"
                type="text"
                placeholder="City or locality..."
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className="w-full bg-transparent text-sm font-semibold text-ink-primary placeholder:text-ink-muted focus:outline-none"
              />
            </div>
          </div>

          {/* Shoot Type / Category Selector */}
          <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle/80 hover:border-brand focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
            <label htmlFor="search-category" className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted">
              Shoot Type
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <Camera className="w-4 h-4 text-brand shrink-0" />
              <select
                id="search-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
              >
                <option value="all">All Genres</option>
                <option value="portraits">Portraits</option>
                <option value="reels">Reels & Creators</option>
                <option value="couples">Couples</option>
                <option value="events">Events</option>
              </select>
            </div>
          </div>

          {/* Date Selector */}
          <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle/80 hover:border-brand focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
            <label htmlFor="search-date" className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted">
              Date
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <Calendar className="w-4 h-4 text-brand shrink-0" />
              <input
                id="search-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div className="p-3 bg-canvas-primary rounded-card-sm border border-contour-subtle/80 hover:border-brand focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
            <label htmlFor="search-duration" className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-muted">
              Duration
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-4 h-4 text-brand shrink-0" />
              <select
                id="search-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer"
              >
                <option value="1">1 Hour Shoot</option>
                <option value="2">2 Hours (Standard)</option>
                <option value="3">3 Hours Half-Day</option>
                <option value="5">5+ Hours Production</option>
              </select>
            </div>
          </div>
        </div>

        {validationError && (
          <p className="text-xs font-semibold text-red-600 px-1 pt-2">{validationError}</p>
        )}

        {/* Submit Action */}
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-contour-subtle">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Over 1,200 verified visual creators ready across India</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto px-8"
            leftIcon={<Search className="w-4 h-4" />}
          >
            Search Photographers
          </Button>
        </div>
      </form>
    </div>
  );
};
