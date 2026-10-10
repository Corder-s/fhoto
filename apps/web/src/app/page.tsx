import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Star, 
  ShieldCheck, 
  KeyRound, 
  CreditCard, 
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: '✨' },
  { id: 'portrait', name: 'Portraits & Headshots', icon: '👤' },
  { id: 'wedding', name: 'Weddings & Pre-Wedding', icon: '💍' },
  { id: 'event', name: 'Birthdays & Private Events', icon: '🎉' },
  { id: 'commercial', name: 'Commercial & Brand', icon: '🛍️' },
  { id: 'fashion', name: 'Fashion & Editorial', icon: '👗' },
];

const FEATURED_CREATORS = [
  {
    id: 'pro-1',
    name: 'Kabir Varma',
    city: 'South Delhi, New Delhi',
    rating: 4.96,
    reviewsCount: 148,
    specialty: 'Editorial & Celebrity Portraits',
    startingPrice: '₹4,500',
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    verified: true,
    badges: ['Top Rated', 'Sony Alpha Ambassador'],
  },
  {
    id: 'pro-2',
    name: 'Ananya Deshmukh',
    city: 'Bandra West, Mumbai',
    rating: 4.98,
    reviewsCount: 215,
    specialty: 'Candid Weddings & Stories',
    startingPrice: '₹8,000',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    verified: true,
    badges: ['Wedding Specialist', '4K Cinema'],
  },
  {
    id: 'pro-3',
    name: 'Rohan Sengupta',
    city: 'Indiranagar, Bengaluru',
    rating: 4.92,
    reviewsCount: 94,
    specialty: 'Culinary, Cafe & Commercial',
    startingPrice: '₹3,500',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    verified: true,
    badges: ['Commercial Pro', 'Fast 24h Delivery'],
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-canvas-primary via-canvas-primary to-canvas-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              {/* Trust Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-subtle border border-brand-border text-brand text-xs sm:text-sm font-semibold tracking-wide shadow-sm">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>On-Demand Creative Visual Talent</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink-primary leading-[1.15]">
                Book Vetted Photographers <br className="hidden sm:inline" />
                <span className="text-brand">Delivered to Your Venue</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-ink-secondary max-w-2xl mx-auto leading-relaxed font-normal">
                Transparent packages, verified creator portfolios, live GPS tracking, and secure OTP-guaranteed shoot starts.
              </p>

              {/* SEARCH ENGINE BAR */}
              <div className="mt-8 p-3 bg-white rounded-card-lg shadow-card border border-contour-subtle text-left max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Location Picker */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-canvas-primary rounded-card-sm border border-contour-subtle/60 hover:border-brand transition-colors">
                    <MapPin className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-ink-muted">Where</p>
                      <input 
                        type="text" 
                        placeholder="Current city or area..."
                        defaultValue="Delhi NCR"
                        className="w-full bg-transparent text-sm font-semibold text-ink-primary placeholder:text-ink-muted focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Shoot Category Picker */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-canvas-primary rounded-card-sm border border-contour-subtle/60 hover:border-brand transition-colors">
                    <Calendar className="w-5 h-5 text-brand shrink-0" />
                    <div className="w-full">
                      <p className="text-xs uppercase font-bold tracking-wider text-ink-muted">Category</p>
                      <select className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer">
                        <option value="portrait">Portraits & Headshots</option>
                        <option value="wedding">Weddings & Candid</option>
                        <option value="event">Birthdays & Events</option>
                        <option value="commercial">Commercial / Brand</option>
                      </select>
                    </div>
                  </div>

                  {/* Search CTA */}
                  <div className="flex items-center">
                    <Link
                      href="/photographers"
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-card-sm bg-brand hover:bg-brand-hover text-white font-bold text-base shadow-sm transition-transform active:scale-[0.99]"
                    >
                      <Search className="w-5 h-5" />
                      Find Creators Near Me
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Category Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/photographers?category=${cat.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-canvas-secondary hover:bg-canvas-tertiary text-ink-secondary border border-contour-subtle transition-all"
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY & TRUST TRIAD */}
        <section className="py-12 bg-white border-y border-contour-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="flex items-start gap-4 p-5 rounded-card-md bg-canvas-primary/50 border border-contour-subtle/50">
                <div className="w-12 h-12 rounded-card-sm bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-primary">Shoot-Start OTP Handshake</h3>
                  <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                    Shoots only initiate when you provide the 6-digit verification code to the creator upon venue arrival.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 p-5 rounded-card-md bg-canvas-primary/50 border border-contour-subtle/50">
                <div className="w-12 h-12 rounded-card-sm bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-primary">100% Escrow Protection</h3>
                  <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                    Your payment stays safely in platform escrow and is only released after you inspect delivered photographs.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 p-5 rounded-card-md bg-canvas-primary/50 border border-contour-subtle/50">
                <div className="w-12 h-12 rounded-card-sm bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-primary">Government-ID Verified</h3>
                  <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                    Every creator undergoes government identity validation, portfolio authenticity checks, and gear screening.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED CREATORS DIRECTORY */}
        <section className="py-20 bg-canvas-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-brand">Handpicked Artists</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary mt-1">
                  Featured Top Photographers
                </h2>
              </div>
              <Link 
                href="/photographers" 
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover transition-colors"
              >
                View all creators <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FEATURED_CREATORS.map((creator) => (
                <div 
                  key={creator.id}
                  className="group bg-white rounded-card-lg overflow-hidden border border-contour-subtle hover:border-contour-strong shadow-subtle hover:shadow-card transition-all duration-300"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-canvas-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={creator.coverImage} 
                      alt={creator.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {creator.badges.map((b) => (
                        <span key={b} className="px-2.5 py-1 rounded-card-sm text-[11px] font-bold bg-ink-primary/80 backdrop-blur-md text-white">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-lg font-bold text-ink-primary">{creator.name}</h3>
                          <CheckCircle2 className="w-4 h-4 text-brand fill-brand-subtle" />
                        </div>
                        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-ink-muted" />
                          {creator.city}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-card-sm bg-canvas-primary border border-contour-subtle text-xs font-bold text-ink-primary">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{creator.rating}</span>
                        <span className="text-ink-muted font-normal">({creator.reviewsCount})</span>
                      </div>
                    </div>

                    <p className="text-sm text-ink-secondary font-medium">
                      {creator.specialty}
                    </p>

                    <div className="border-t border-contour-subtle pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">Starts from</p>
                        <p className="text-lg font-extrabold text-ink-primary">{creator.startingPrice}</p>
                      </div>

                      <Link
                        href={`/photographers/${creator.id}`}
                        className="px-4 py-2 rounded-card-sm text-xs font-bold bg-brand hover:bg-brand-hover text-white transition-colors"
                      >
                        View Portfolio
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CREATOR ONBOARDING CALLOUT */}
        <section className="py-20 bg-canvas-secondary border-t border-contour-subtle">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white text-ink-primary border border-contour-subtle">
              Creator Partnership Program
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-primary">
              Are You a Professional Visual Artist?
            </h2>
            <p className="text-base sm:text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed">
              Join India&apos;s fastest growing photography marketplace. Zero upfront listing fees, automated calendar bookings, and 80% guaranteed net payout directly to your bank account.
            </p>
            <div className="pt-2">
              <Link
                href="/pro/onboarding"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-card-sm text-base font-bold text-white bg-brand hover:bg-brand-hover active:bg-brand-active shadow-sm transition-all"
              >
                Apply as a Creator Today <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
