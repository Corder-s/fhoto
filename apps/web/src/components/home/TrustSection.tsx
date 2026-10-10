import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const TRUST_ITEMS = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand" />,
      title: 'Verified photographers',
      description: 'Every visual artist undergoes government ID validation, camera gear checks, and rigorous portfolio authentication.',
    },
    {
      icon: <Lock className="w-6 h-6 text-brand" />,
      title: 'Secure booking experience',
      description: 'Payments held in 100% escrow and released only after delivery. Shoots start via an in-person 6-digit OTP verification.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-brand" />,
      title: 'High-quality photo delivery',
      description: 'Download pristine, full-resolution 4K deliverables and complete gallery ZIP files from private, high-speed cloud storage.',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-contour-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRUST_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-5 rounded-card-md bg-canvas-primary/60 border border-contour-subtle/70"
            >
              <div className="w-12 h-12 rounded-card-sm bg-brand-subtle flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink-primary tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
