import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function CancellationPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-white p-8 sm:p-12 rounded-card-lg border border-contour-subtle shadow-subtle">
          <span className="text-xs uppercase font-extrabold tracking-wider text-brand">Fair Refund Policy</span>
          <h1 className="text-3xl font-extrabold text-ink-primary">Cancellation & Refund Policy</h1>
          <p className="text-xs text-ink-muted">Last updated: October 2026</p>

          <div className="space-y-6 text-sm text-ink-secondary leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">1. Customer Cancellation Windows</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Cancellation &gt; 24 Hours before scheduled shoot:</strong> 100% full refund returned to the original payment method.</li>
                <li><strong>Cancellation between 6 and 24 Hours:</strong> 50% partial refund (50% paid to the photographer as compensation for blocked calendar time).</li>
                <li><strong>Cancellation &lt; 6 Hours:</strong> Non-refundable to protect the scheduled creator against last-minute travel and opportunity loss.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">2. Photographer No-Show Policy</h2>
              <p>
                In the rare event that a photographer fails to arrive at the venue and the Shoot-Start OTP is not verified, the client receives a 100% immediate refund plus platform booking credit for an alternate creator.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
