'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-[#171A1F] text-white hover:bg-black border border-[#262B33] shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in"
    >
      <ArrowUp className="w-5 h-5 stroke-[2.2]" />
    </button>
  );
};
