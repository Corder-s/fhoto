'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const HomeFaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const FAQS: FaqItem[] = [
    {
      question: 'How does the Shoot-Start OTP handshake protect me?',
      answer: 'When your photographer arrives at your venue, you share a confidential 6-digit OTP visible exclusively in your customer dashboard. The photographer enters this into their creator studio to officially commence the booking. This guarantees attendance before any booking milestone triggers.',
    },
    {
      question: 'When is my payment released to the photographer?',
      answer: 'Your payment is held in an RBI-compliant 100% escrow vault. It is only released to the photographer after you have reviewed and approved your final color-graded photos in your private online gallery.',
    },
    {
      question: 'What if bad weather affects an outdoor portrait or pre-wedding shoot?',
      answer: 'SnapShoot offers free date rescheduling up to 12 hours before the scheduled shoot time. You and your photographer can easily coordinate an alternative golden-hour slot without any penalty.',
    },
    {
      question: 'In what format and resolution are the photos delivered?',
      answer: 'All deliverables are high-resolution, print-ready 4K JPEGs (300 DPI) plus web-optimized versions for social media and reels. You can download individual photos directly from your proofing gallery or download the complete session as a high-speed ZIP file.',
    },
    {
      question: 'Are SnapShoot photographers background checked and verified?',
      answer: 'Yes! Every photographer on SnapShoot must undergo government identity checks (Aadhaar/PAN/Passport verification), professional camera and lens verification, and strict portfolio authenticity review by our operations team.',
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-[#FAF7F2]">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C847A]">
            HAVE QUESTIONS?
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#1A1816] tracking-tight">
            Frequently asked questions.
          </h2>
          <p className="text-xs sm:text-sm text-[#665E55]">
            Everything you need to know about booking and working with SnapShoot photographers.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#EBE4DA] overflow-hidden transition-all shadow-[0_2px_8px_-2px_rgba(26,24,22,0.03)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 hover:bg-[#FAF7F2]/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-[#1A1816]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border border-[#E0D8CD] flex items-center justify-center text-[#5A544D] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#FAF7F2] text-[#FF6E00]' : ''
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#665E55] leading-relaxed border-t border-[#F2ECE3] animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions link */}
        <div className="text-center pt-2">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6E00] hover:text-[#E86300] transition-colors"
          >
            <span>Learn more about how our platform works</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
