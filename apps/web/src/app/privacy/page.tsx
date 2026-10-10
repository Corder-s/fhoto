import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-white p-8 sm:p-12 rounded-card-lg border border-contour-subtle shadow-subtle">
          <span className="text-xs uppercase font-extrabold tracking-wider text-brand">Legal & Security</span>
          <h1 className="text-3xl font-extrabold text-ink-primary">Privacy Policy</h1>
          <p className="text-xs text-ink-muted">Last updated: October 2026</p>

          <div className="space-y-6 text-sm text-ink-secondary leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">1. Information We Collect</h2>
              <p>
                SnapShoot collects personal information including phone numbers for OTP authentication, shoot venue addresses, and photographer KYC documents (government identity cards). All photographer KYC documents are stored in encrypted, private cloud buckets and never exposed to the public.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">2. Shoot Photography & Delivered Media</h2>
              <p>
                Photographs and videos delivered through SnapShoot are strictly accessible only by the booking client and the assigned photographer via time-limited, cryptographically signed URLs. SnapShoot does not sell or license your personal images to third parties.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-ink-primary">3. Location Data & Live Transit</h2>
              <p>
                Photographer live GPS coordinates are broadcast solely when a shoot status is actively transitioned to &ldquo;ON_THE_WAY&rdquo; and terminated once arrival is verified via OTP. Continuous background location tracking outside of active shoots is never performed.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
