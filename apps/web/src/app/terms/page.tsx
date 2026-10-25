import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-white p-8 sm:p-12 rounded-card-lg border border-contour-subtle shadow-subtle">
          <span className="text-xs uppercase font-extrabold tracking-wider text-brand">Terms of Use</span>
          <h1 className="text-3xl font-extrabold text-ink-primary">Terms of Service</h1>
          <p className="text-xs text-ink-muted">Last updated: October 2026</p>

          <div className="space-y-6 text-sm text-ink-secondary leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">1. Platform Service Scope</h2>
              <p>
                REEPY operates as a technology marketplace connecting customers with independent professional visual creators. Photographers are independent professionals, not platform employees.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">2. Escrow & Payment Settlement</h2>
              <p>
                All customer payments are captured in full at checkout and held securely in escrow. Payouts are transferred to the creator&apos;s bank account after deliverable approval or the 7-day dispute window expiration.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">3. Shoot-Start OTP Handshake</h2>
              <p>
                The shoot session timer officially starts only when the client provides their 6-digit Shoot-Start OTP to the photographer upon physical arrival at the venue.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
