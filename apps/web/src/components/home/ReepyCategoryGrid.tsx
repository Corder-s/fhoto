'use client';

import React from 'react';
import Link from 'next/link';
import {
  Video,
  Heart,
  Camera,
  Sparkles,
  Star,
  MapPin,
  Users,
  Package,
  ChevronRight,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href: string;
}

export const ReepyCategoryGrid: React.FC = () => {
  const categories: CategoryItem[] = [
    {
      id: 'reels',
      title: 'Reels',
      subtitle: 'Find local pros',
      icon: <Video className="w-5 h-5" />,
      iconBg: 'bg-[#FFF1F2]',
      iconColor: 'text-[#E11D48]',
      href: '/explore?category=Reels',
    },
    {
      id: 'weddings',
      title: 'Weddings',
      subtitle: 'Find local pros',
      icon: <Heart className="w-5 h-5" />,
      iconBg: 'bg-[#FDF2F8]',
      iconColor: 'text-[#DB2777]',
      href: '/explore?category=Weddings',
    },
    {
      id: 'portraits',
      title: 'Portraits',
      subtitle: 'Find local pros',
      icon: <Camera className="w-5 h-5" />,
      iconBg: 'bg-[#ECFDF5]',
      iconColor: 'text-[#059669]',
      href: '/explore?category=Portraits',
    },
    {
      id: 'fashion',
      title: 'Fashion',
      subtitle: 'Find local pros',
      icon: <Sparkles className="w-5 h-5" />,
      iconBg: 'bg-[#FAF5FF]',
      iconColor: 'text-[#9333EA]',
      href: '/explore?category=Fashion',
    },
    {
      id: 'food',
      title: 'Food',
      subtitle: 'Find local pros',
      icon: <Star className="w-5 h-5" />,
      iconBg: 'bg-[#FFFBEB]',
      iconColor: 'text-[#D97706]',
      href: '/explore?category=Food',
    },
    {
      id: 'travel',
      title: 'Travel',
      subtitle: 'Find local pros',
      icon: <MapPin className="w-5 h-5" />,
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#2563EB]',
      href: '/explore?category=Travel',
    },
    {
      id: 'events',
      title: 'Events',
      subtitle: 'Find local pros',
      icon: <Users className="w-5 h-5" />,
      iconBg: 'bg-[#EEF2FF]',
      iconColor: 'text-[#4F46E5]',
      href: '/explore?category=Events',
    },
    {
      id: 'product',
      title: 'Product',
      subtitle: 'Find local pros',
      icon: <Camera className="w-5 h-5" />,
      iconBg: 'bg-[#F0FDFA]',
      iconColor: 'text-[#0D9488]',
      href: '/explore?category=Product',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-t border-b border-[#E7EAEE]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs sm:text-sm font-black tracking-wider text-[#14B8A6] uppercase">
            BROWSE BY CATEGORY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#191C22] tracking-tight">
            What kind of content do you need?
          </h2>
        </div>

        {/* 8 Categories Responsive Grid: 4 columns on large screens, 2 on medium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="bg-[#F8FAFC] hover:bg-white rounded-2xl border border-[#E7EAEE] p-5 flex items-center justify-between shadow-xs hover:shadow-md hover:border-[#CBD5E1] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg} ${cat.iconColor}`}
                >
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191C22] group-hover:text-[#14B8A6] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#191C22] group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
