import React from 'react';
import Link from 'next/link';
import {
  Camera,
  ShieldCheck,
  Heart,
  Phone,
  Mail,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#FAF7F2] border-t border-[#E8E1D6] mt-auto text-[#1A1816]">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-[#E8E1D6] bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF4EB] border border-[#FFD9B3] flex items-center justify-center text-[#FF6E00] shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816]">100% Escrow Protection</h4>
                <p className="text-[11px] text-[#665E55] mt-0.5 leading-relaxed">
                  Funds held securely. Released only after verified completion.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF4EB] border border-[#FFD9B3] flex items-center justify-center text-[#FF6E00] shrink-0">
                <Lock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816]">Shoot-Start OTP System</h4>
                <p className="text-[11px] text-[#665E55] mt-0.5 leading-relaxed">
                  In-person 6-digit handshake guarantees attendance before starting.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF4EB] border border-[#FFD9B3] flex items-center justify-center text-[#FF6E00] shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816]">Vetted & Background Checked</h4>
                <p className="text-[11px] text-[#665E55] mt-0.5 leading-relaxed">
                  Curated top 5% creative professionals with verified portfolios.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF4EB] border border-[#FFD9B3] flex items-center justify-center text-[#FF6E00] shrink-0">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1816]">24–48h Digital Delivery</h4>
                <p className="text-[11px] text-[#665E55] mt-0.5 leading-relaxed">
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
          {/* Col 1: About SnapShoot */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF6E00] flex items-center justify-center text-white shadow-sm">
                <Camera className="w-5 h-5 fill-white/20 stroke-[2.2]" />
              </div>
              <span className="text-xl font-black tracking-tight text-[#1A1816]">
                SNAP<span className="text-[#FF6E00]">SHOOT</span>
              </span>
            </Link>
            <p className="text-xs text-[#5A544D] leading-relaxed max-w-sm">
              SnapShoot is India&apos;s verified on-demand marketplace connecting individuals, content creators, and businesses with curated professional photographers and filmmakers. Book in minutes with verified Shoot-Start OTP handshake and full escrow protection.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#5A544D]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FF6E00]" />
                <span>support@snapshoot.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF6E00]" />
                <span>+91 98101 23456 (Concierge & Bookings)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#FF6E00]" />
                <span>Support: 9:00 AM – 9:00 PM IST (Mon – Sun)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Services & Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5A544D]">
              <li><Link href="/categories" className="hover:text-[#FF6E00] transition-colors">Portrait Sessions</Link></li>
              <li><Link href="/categories" className="hover:text-[#FF6E00] transition-colors">Creator & Viral Reels</Link></li>
              <li><Link href="/categories" className="hover:text-[#FF6E00] transition-colors">Weddings & Pre-Weddings</Link></li>
              <li><Link href="/categories" className="hover:text-[#FF6E00] transition-colors">Couples & Love Stories</Link></li>
              <li><Link href="/categories" className="hover:text-[#FF6E00] transition-colors">Events & Celebrations</Link></li>
              <li><Link href="/categories" className="hover:text-[#FF6E00] transition-colors">Corporate & Commercial</Link></li>
            </ul>
          </div>

          {/* Col 3: Covered Cities in India */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF6E00]" />
              <span>Covered Cities</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5A544D]">
              <li><Link href="/explore?location=Delhi+NCR" className="hover:text-[#FF6E00] transition-colors">Delhi NCR (Noida, Gurugram)</Link></li>
              <li><Link href="/explore?location=Mumbai" className="hover:text-[#FF6E00] transition-colors">Mumbai & Navi Mumbai</Link></li>
              <li><Link href="/explore?location=Bengaluru" className="hover:text-[#FF6E00] transition-colors">Bengaluru</Link></li>
              <li><Link href="/explore?location=Goa" className="hover:text-[#FF6E00] transition-colors">Goa (Beaches & Resorts)</Link></li>
              <li><Link href="/explore?location=Jaipur" className="hover:text-[#FF6E00] transition-colors">Jaipur & Udaipur</Link></li>
              <li><Link href="/explore?location=Pune" className="hover:text-[#FF6E00] transition-colors">Pune & Hyderabad</Link></li>
            </ul>
          </div>

          {/* Col 4: Platform & Support Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-4">
              Client & Creator
            </h4>
            <ul className="space-y-2.5 text-xs text-[#5A544D]">
              <li><Link href="/customer/dashboard" className="hover:text-[#FF6E00] transition-colors font-medium text-[#1A1816]">Client Portal Dashboard</Link></li>
              <li><Link href="/customer/bookings" className="hover:text-[#FF6E00] transition-colors">My Shoots & OTP Codes</Link></li>
              <li><Link href="/customer/gallery" className="hover:text-[#FF6E00] transition-colors">Client Photo Vault</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#FF6E00] transition-colors">How SnapShoot Works</Link></li>
              <li><Link href="/for-photographers" className="hover:text-[#FF6E00] transition-colors">Join Creator Network</Link></li>
              <li><Link href="/photographer/dashboard" className="hover:text-[#FF6E00] transition-colors">Creator Studio Sign-In</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer with Legal */}
        <div className="border-t border-[#E8E1D6] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C847A] gap-4">
          <p>© {new Date().getFullYear()} SnapShoot Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-[#1A1816] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1A1816] transition-colors">Terms of Service</Link>
            <Link href="/cancellation" className="hover:text-[#1A1816] transition-colors">Cancellation & Escrow Policy</Link>
            <span className="inline-flex items-center gap-1 text-[#5A544D]">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-[#FF6E00] fill-[#FF6E00]" />
              <span>for creators & clients across India</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
