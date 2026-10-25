import React from 'react';
import Link from 'next/link';
import {
  Camera,
  ShieldCheck,
  Phone,
  Mail,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0D0F12] border-t border-[#1F242D] mt-auto text-white">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-[#1F242D] bg-[#14171D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">100% Escrow Protection</h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                  Funds held securely. Released only after verified completion.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
                <Lock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Shoot-Start OTP System</h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                  In-person 6-digit handshake guarantees attendance before starting.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Vetted & Background Checked</h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                  Curated top 5% creative professionals with verified portfolios.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">24–48h Digital Delivery</h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                  Color-graded 4K galleries delivered securely to your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: About */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#14B8A6] flex items-center justify-center text-[#0D0F12] shadow-sm">
                <Camera className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                REEPY
              </span>
            </Link>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm">
              Discover and book talented local photographers and filmmakers for reels, portraits, weddings, and commercial content. Secure escrow payments and guaranteed Shoot-Start OTP arrival verification.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>support@reepy.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>+91 98101 23456 (Concierge & Bookings)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Support: 9:00 AM – 9:00 PM IST (Mon – Sun)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-[#94A3B8]">
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Reels & TikTok</Link></li>
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Weddings</Link></li>
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Portraits</Link></li>
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Fashion</Link></li>
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Food</Link></li>
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Travel</Link></li>
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Events</Link></li>
              <li><Link href="/categories" className="hover:text-[#14B8A6] transition-colors">Product</Link></li>
            </ul>
          </div>

          {/* Col 3: Cities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Cities</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#94A3B8]">
              <li><Link href="/explore?location=Mumbai" className="hover:text-[#14B8A6] transition-colors">Mumbai (Bandra, Juhu)</Link></li>
              <li><Link href="/explore?location=Delhi+NCR" className="hover:text-[#14B8A6] transition-colors">Delhi NCR (Noida, Gurugram)</Link></li>
              <li><Link href="/explore?location=Bengaluru" className="hover:text-[#14B8A6] transition-colors">Bengaluru (Indiranagar, Koramangala)</Link></li>
              <li><Link href="/explore?location=Jaipur" className="hover:text-[#14B8A6] transition-colors">Jaipur (Civil Lines, C-Scheme)</Link></li>
              <li><Link href="/explore?location=Chennai" className="hover:text-[#14B8A6] transition-colors">Chennai (Anna Nagar, T. Nagar)</Link></li>
              <li><Link href="/explore?location=Goa" className="hover:text-[#14B8A6] transition-colors">Goa (North & South)</Link></li>
            </ul>
          </div>

          {/* Col 4: Platform & Roles */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Explore & Join
            </h4>
            <ul className="space-y-2.5 text-xs text-[#94A3B8]">
              <li><Link href="/explore" className="hover:text-[#14B8A6] transition-colors">Browse Photographers</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#14B8A6] transition-colors">How It Works</Link></li>
              <li><Link href="/for-photographers" className="hover:text-[#14B8A6] transition-colors font-medium text-white">Join as Photographer</Link></li>
              <li><Link href="/customer/dashboard" className="hover:text-[#14B8A6] transition-colors">Client Portal</Link></li>
              <li><Link href="/photographer/dashboard" className="hover:text-[#14B8A6] transition-colors">Creator Studio</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-[#14B8A6] transition-colors">Admin Operations</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer with Legal */}
        <div className="border-t border-[#1F242D] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© {new Date().getFullYear()} REEPY Marketplace. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cancellation" className="hover:text-white transition-colors">Cancellation & Escrow Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
