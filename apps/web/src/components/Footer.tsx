import React from 'react';
import Link from 'next/link';
import { Camera, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-canvas-secondary border-t border-contour-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* About SnapShoot */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-card-sm bg-brand flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-ink-primary">
                Snap<span className="text-brand">Shoot</span>
              </span>
            </Link>
            <p className="text-sm text-ink-secondary leading-relaxed">
              SnapShoot is India&apos;s curated on-demand marketplace connecting individuals, creators, and brands with vetted professional photographers and filmmakers.
            </p>
          </div>

          {/* Explore Photographers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary mb-4">
              Explore Photographers
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-secondary">
              <li><Link href="/photographers" className="hover:text-ink-primary transition-colors">All Photographers</Link></li>
              <li><Link href="/explore" className="hover:text-ink-primary transition-colors">Geospatial Radar Search</Link></li>
              <li><Link href="/categories" className="hover:text-ink-primary transition-colors">Photography Categories</Link></li>
              <li><Link href="/stories" className="hover:text-ink-primary transition-colors">Visual Stories & Inspiration</Link></li>
            </ul>
          </div>

          {/* For Photographers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary mb-4">
              For Photographers
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-secondary">
              <li><Link href="/for-photographers" className="hover:text-ink-primary transition-colors">Join as a Creator</Link></li>
              <li><Link href="/how-it-works" className="hover:text-ink-primary transition-colors">How Creator Payouts Work</Link></li>
              <li><Link href="/login" className="hover:text-ink-primary transition-colors">Creator Studio Sign-In</Link></li>
            </ul>
          </div>

          {/* Contact & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary mb-4">
              Trust & Policies
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-secondary">
              <li><Link href="/how-it-works" className="hover:text-ink-primary transition-colors">Shoot-Start OTP System</Link></li>
              <li><Link href="/privacy" className="hover:text-ink-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-ink-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cancellation" className="hover:text-ink-primary transition-colors">Cancellation & Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-contour-subtle mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-4">
          <p>© {new Date().getFullYear()} SnapShoot Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-ink-secondary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink-secondary transition-colors">Terms</Link>
            <Link href="/cancellation" className="hover:text-ink-secondary transition-colors">Cancellation Policy</Link>
            <span className="flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-brand fill-brand" /> for creators
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
