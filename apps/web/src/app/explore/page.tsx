import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { MapPin, Search, Star, Filter, SlidersHorizontal, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const EXPLORE_CREATORS = [
  {
    id: 'pro-1',
    name: 'Kabir Varma',
    city: 'Hauz Khas, New Delhi',
    rating: 4.96,
    reviewsCount: 148,
    specialty: 'Editorial & Portrait Specialist',
    price: '₹4,500',
    distanceKm: '3.2 km away',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    verified: true,
  },
  {
    id: 'pro-2',
    name: 'Ananya Deshmukh',
    city: 'Bandra West, Mumbai',
    rating: 4.98,
    reviewsCount: 215,
    specialty: 'Candid Weddings & 4K Cinema',
    price: '₹8,000',
    distanceKm: '5.1 km away',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    verified: true,
  },
  {
    id: 'pro-3',
    name: 'Rohan Sengupta',
    city: 'Indiranagar, Bengaluru',
    rating: 4.92,
    reviewsCount: 94,
    specialty: 'Culinary, Cafes & Commercial',
    price: '₹3,500',
    distanceKm: '2.8 km away',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    verified: true,
  },
  {
    id: 'pro-4',
    name: 'Tanvi Malik',
    city: 'DLF Phase 5, Gurugram',
    rating: 4.95,
    reviewsCount: 82,
    specialty: 'Fashion Lookbooks & Modeling Portfolios',
    price: '₹6,000',
    distanceKm: '7.4 km away',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    verified: true,
  },
];

export default function ExplorePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand text-xs font-bold mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Geospatial Radar</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary">
                Explore Verified Creators Near You
              </h1>
              <p className="text-sm sm:text-base text-ink-secondary mt-1">
                Showing vetted visual artists within a 15 km radius of your location.
              </p>
            </div>

            {/* View Mode Toggle / Filters */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="w-4 h-4" />}>
                Filter Radius
              </Button>
              <Button variant="primary" size="sm">
                Instant Availability
              </Button>
            </div>
          </div>

          {/* SPLIT VIEW (List + Simulated Radar Map) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* List Column */}
            <div className="lg:col-span-7 space-y-5">
              {EXPLORE_CREATORS.map((c) => (
                <Card key={c.id} hoverEffect className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Thumbnail */}
                    <div className="sm:w-44 h-48 sm:h-auto rounded-card-sm overflow-hidden bg-canvas-secondary relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <Badge variant="dark" size="sm">
                          {c.distanceKm}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-lg font-bold text-ink-primary">{c.name}</h2>
                            <ShieldCheck className="w-4 h-4 text-brand" />
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-ink-primary bg-canvas-secondary px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{c.rating}</span>
                          </div>
                        </div>

                        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-ink-muted" />
                          {c.city}
                        </p>

                        <p className="text-sm text-ink-secondary font-medium mt-2">
                          {c.specialty}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-contour-subtle">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-ink-muted">Packages from</p>
                          <p className="text-base font-extrabold text-ink-primary">{c.price}</p>
                        </div>
                        <Link
                          href={`/photographers/${c.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-card-sm text-xs font-bold bg-brand hover:bg-brand-hover text-white transition-colors"
                        >
                          View Profile <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Radar / Geospatial Map Simulation Column */}
            <div className="lg:col-span-5 sticky top-28">
              <div className="bg-canvas-secondary rounded-card-lg border border-contour-subtle p-6 overflow-hidden relative shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-primary">Live Radar Grid</span>
                  </div>
                  <span className="text-xs text-ink-secondary font-semibold">PostGIS 4326</span>
                </div>

                {/* Map Mock Canvas */}
                <div className="h-96 w-full rounded-card-md bg-canvas-tertiary border border-contour-strong relative flex items-center justify-center overflow-hidden">
                  {/* Concentric Radar Rings */}
                  <div className="absolute w-72 h-72 rounded-full border border-dashed border-contour-strong/80" />
                  <div className="absolute w-48 h-48 rounded-full border border-contour-strong/80" />
                  <div className="absolute w-24 h-24 rounded-full border border-brand/30 bg-brand/5" />

                  {/* Client Center Marker */}
                  <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-white text-[10px] font-bold shadow-md z-10">
                    📍
                  </div>

                  {/* Creator Points on Map */}
                  <div className="absolute top-16 left-24 p-1.5 bg-white rounded-full shadow-card border border-contour-subtle flex items-center gap-1 text-[11px] font-bold text-ink-primary">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Kabir (3.2km)</span>
                  </div>
                  <div className="absolute bottom-20 right-16 p-1.5 bg-white rounded-full shadow-card border border-contour-subtle flex items-center gap-1 text-[11px] font-bold text-ink-primary">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Rohan (2.8km)</span>
                  </div>
                  <div className="absolute top-28 right-24 p-1.5 bg-white rounded-full shadow-card border border-contour-subtle flex items-center gap-1 text-[11px] font-bold text-ink-primary">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Tanvi (7.4km)</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-card-sm bg-white border border-contour-subtle text-xs text-ink-secondary flex items-center justify-between">
                  <span>Current search radius: <strong>15.0 km</strong></span>
                  <span className="text-brand font-bold cursor-pointer hover:underline">Change Radius</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
