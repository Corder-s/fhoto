import Link from 'next/link';
import { Camera, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-canvas-secondary border-t border-contour-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
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
              India&apos;s premier on-demand visual marketplace. Verified photographers & videographers delivered to your venue within hours.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-ink-primary mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-secondary">
              <li><Link href="/photographers?category=portrait" className="hover:text-ink-primary">Portraits & Headshots</Link></li>
              <li><Link href="/photographers?category=wedding" className="hover:text-ink-primary">Weddings & Engagements</Link></li>
              <li><Link href="/photographers?category=event" className="hover:text-ink-primary">Events & Birthdays</Link></li>
              <li><Link href="/photographers?category=commercial" className="hover:text-ink-primary">Commercial & Food</Link></li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-ink-primary mb-4">
              Trust & Safety
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-secondary">
              <li><Link href="/safety" className="hover:text-ink-primary">Identity & KYC Checks</Link></li>
              <li><Link href="/escrow" className="hover:text-ink-primary">100% Escrow Protection</Link></li>
              <li><Link href="/otp-handshake" className="hover:text-ink-primary">Shoot-Start OTP System</Link></li>
              <li><Link href="/cancellation-policy" className="hover:text-ink-primary">Cancellation Policies</Link></li>
            </ul>
          </div>

          {/* Creator Portal */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-ink-primary mb-4">
              For Creators
            </h4>
            <p className="text-sm text-ink-secondary mb-3 leading-relaxed">
              Grow your client base and get guaranteed on-time bank settlements.
            </p>
            <Link
              href="/pro/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-card-sm text-sm font-semibold text-white bg-ink-primary hover:bg-black transition-colors"
            >
              <Shield className="w-4 h-4 text-brand" />
              Apply as a Creator
            </Link>
          </div>
        </div>

        <div className="border-t border-contour-subtle mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-4">
          <p>© {new Date().getFullYear()} SnapShoot Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-ink-secondary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink-secondary">Terms of Service</Link>
            <span className="flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-brand fill-brand" /> for creators
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
