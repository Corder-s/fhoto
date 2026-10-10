'use client';

import React from 'react';
import { SAMPLE_CATEGORIES, PhotographyCategory } from '../../data/categories';
import { Card } from '../ui/Card';
import { ArrowRight } from 'lucide-react';

interface CategorySectionProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="py-16 md:py-24 bg-canvas-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
              Curated Specialties
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary mt-1">
              Photography Categories
            </h2>
          </div>
          <p className="text-sm text-ink-secondary max-w-md">
            Click any genre to filter available visual creators or explore verified portfolios.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_CATEGORIES.map((cat: PhotographyCategory) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className="cursor-pointer group"
              >
                <Card
                  hoverEffect
                  className={`p-0 overflow-hidden flex flex-col justify-between h-full transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-brand border-brand shadow-card' : ''
                  }`}
                >
                  <div>
                    {/* Category Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-canvas-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.imageUrl}
                        alt={cat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-ink-primary/80 backdrop-blur-md px-2.5 py-0.5 rounded-card-sm text-[11px] font-bold text-white">
                        From ₹{cat.startingPriceInr.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-1.5">
                      <h3 className="text-lg font-bold text-ink-primary group-hover:text-brand transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-ink-secondary leading-relaxed">
                        {cat.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-brand border-t border-contour-subtle mt-2 pt-3">
                    <span>{isSelected ? '✓ Filter Applied' : 'Browse Artists'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
