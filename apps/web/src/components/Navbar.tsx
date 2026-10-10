import Link from 'next/link';
import { Camera, MapPin, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-canvas-primary/90 backdrop-blur-md border-b border-contour-subtle transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-card-sm bg-brand flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-ink-primary">
            Snap<span className="text-brand">Shoot</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-ink-secondary">
          <Link href="/photographers" className="hover:text-ink-primary transition-colors">
            Explore Creators
          </Link>
          <Link href="/how-it-works" className="hover:text-ink-primary transition-colors">
            How It Works
          </Link>
          <Link href="/pricing" className="hover:text-ink-primary transition-colors">
            Packages
          </Link>
          <Link href="/pro/onboarding" className="flex items-center gap-1.5 text-brand hover:text-brand-hover font-semibold transition-colors">
            <ShieldCheck className="w-4 h-4" />
            Join as Creator
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2.5 rounded-card-sm text-sm font-semibold text-ink-primary hover:bg-canvas-secondary border border-contour-subtle transition-all"
          >
            <User className="w-4 h-4 text-ink-secondary" />
            Sign In
          </Link>
          <Link
            href="/photographers"
            className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-card-sm text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-active shadow-sm transition-all"
          >
            Book a Shoot
          </Link>
        </div>
      </div>
    </header>
  );
}
