import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Camera, 
  Calendar, 
  ArrowRight,
  Share2,
  Heart
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function PhotographerProfilePage({ params }: { params: { id: string } }) {
  const PACKAGES = [
    {
      id: 'pkg-basic',
      name: 'Essential Portrait',
      duration: '1 Hour Shoot',
      photos: '15 Edited High-Res Photos',
      turnaround: '48 Hour Turnaround',
      price: '₹4,500',
      popular: false,
    },
    {
      id: 'pkg-standard',
      name: 'Signature Editorial',
      duration: '2.5 Hours Shoot',
      photos: '35 Edited High-Res Photos + RAW files',
      turnaround: '24 Hour Priority Turnaround',
      price: '₹7,500',
      popular: true,
    },
    {
      id: 'pkg-premium',
      name: 'Complete Production',
      duration: '5 Hours Half-Day Shoot',
      photos: '75 Edited High-Res Photos + 4K Cinema Reel',
      turnaround: 'Full Gallery in 48 Hours',
      price: '₹14,000',
      popular: false,
    },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* PROFILE HEADER CARD */}
          <div className="bg-white rounded-card-lg border border-contour-subtle shadow-subtle p-6 sm:p-8 mb-10">
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-canvas-secondary border-2 border-brand/20 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    alt="Kabir Varma"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">Kabir Varma</h1>
                    <CheckCircle2 className="w-5 h-5 text-brand fill-brand-subtle" />
                    <Badge variant="brand" size="sm">
                      Verified Pro
                    </Badge>
                  </div>

                  <p className="text-sm text-ink-muted flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-ink-muted" />
                    <span>South Delhi, New Delhi • Travel radius: 25 km</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-ink-primary pt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>4.96</span>
                      <span className="text-ink-muted font-normal">(148 reviews)</span>
                    </div>
                    <span>•</span>
                    <span className="text-ink-secondary">8 Years Professional Exp</span>
                    <span>•</span>
                    <span className="text-green-600 font-bold">● Available This Week</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="md" leftIcon={<Share2 className="w-4 h-4" />}>
                  Share
                </Button>
                <Link href="#packages">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Choose Package
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bio & Gear Section */}
            <div className="mt-8 pt-6 border-t border-contour-subtle grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">About the Artist</h2>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Specialized in natural light portraiture, corporate executive branding, and high-fashion editorial imagery. Sony Alpha Ambassador with 8+ years experience working with top publications, actors, and startup founders across Delhi NCR and Mumbai.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Camera Equipment</h2>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-card-sm text-xs font-medium bg-canvas-secondary text-ink-secondary border border-contour-subtle">
                    Sony A7 IV & A7R V
                  </span>
                  <span className="px-2.5 py-1 rounded-card-sm text-xs font-medium bg-canvas-secondary text-ink-secondary border border-contour-subtle">
                    GM 24-70mm f/2.8 II
                  </span>
                  <span className="px-2.5 py-1 rounded-card-sm text-xs font-medium bg-canvas-secondary text-ink-secondary border border-contour-subtle">
                    GM 85mm f/1.4 Portrait
                  </span>
                  <span className="px-2.5 py-1 rounded-card-sm text-xs font-medium bg-canvas-secondary text-ink-secondary border border-contour-subtle">
                    Profoto B10X Lighting
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PACKAGES SELECTION SECTION */}
          <div id="packages" className="mb-14">
            <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
              <p className="text-xs uppercase font-extrabold tracking-wider text-brand">Upfront Pricing</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
                Select Your Shoot Package
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary">
                All packages include shoot-start OTP handshake & 100% platform escrow protection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  hoverEffect
                  className={`flex flex-col justify-between relative ${
                    pkg.popular ? 'border-brand ring-1 ring-brand' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="brand" size="sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-ink-primary">{pkg.name}</h3>
                      <p className="text-2xl font-extrabold text-brand mt-1">{pkg.price}</p>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-ink-secondary">
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand shrink-0" />
                        <span>{pkg.duration}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-brand shrink-0" />
                        <span>{pkg.photos}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand shrink-0" />
                        <span>{pkg.turnaround}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                        <span>Escrow Protected Payment</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-contour-subtle">
                    <Link href={`/login?redirect=/booking/checkout`}>
                      <Button
                        variant={pkg.popular ? 'primary' : 'secondary'}
                        className="w-full"
                        size="md"
                      >
                        Book {pkg.name}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
