import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  SlidersHorizontal, 
  ArrowUpDown, 
  CheckCircle2, 
  Camera 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const DIRECTORY_CREATORS = [
  {
    id: 'pro-1',
    name: 'Kabir Varma',
    city: 'South Delhi, New Delhi',
    rating: 4.96,
    reviewsCount: 148,
    specialty: 'Editorial & Portrait Specialist',
    startingPrice: '₹4,500',
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    tags: ['Sony Alpha 7 IV', 'Studio Lighting', 'Same Day Delivery'],
    experience: '8 yrs exp',
  },
  {
    id: 'pro-2',
    name: 'Ananya Deshmukh',
    city: 'Bandra West, Mumbai',
    rating: 4.98,
    reviewsCount: 215,
    specialty: 'Candid Weddings & 4K Cinema',
    startingPrice: '₹8,000',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    tags: ['Canon R5', 'Drone Certified', 'Color Grading'],
    experience: '10 yrs exp',
  },
  {
    id: 'pro-3',
    name: 'Rohan Sengupta',
    city: 'Indiranagar, Bengaluru',
    rating: 4.92,
    reviewsCount: 94,
    specialty: 'Culinary, Cafes & Commercial Food',
    startingPrice: '₹3,500',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    tags: ['Fujifilm GFX', 'Macro Lenses', 'Product Proofing'],
    experience: '6 yrs exp',
  },
  {
    id: 'pro-4',
    name: 'Tanvi Malik',
    city: 'DLF Phase 5, Gurugram',
    rating: 4.95,
    reviewsCount: 82,
    specialty: 'Fashion Lookbooks & Modeling Portfolios',
    startingPrice: '₹6,000',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    tags: ['Nikon Z9', 'Editorial Retouching', 'Agency Approved'],
    experience: '7 yrs exp',
  },
  {
    id: 'pro-5',
    name: 'Vikramaditya Roy',
    city: 'Koramangala, Bengaluru',
    rating: 4.90,
    reviewsCount: 110,
    specialty: 'Automobile & Real Estate Architecture',
    startingPrice: '₹5,500',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    tags: ['HDR Bracketing', 'Matterport 3D', 'Wide Angle Specialist'],
    experience: '9 yrs exp',
  },
  {
    id: 'pro-6',
    name: 'Meera Nambiar',
    city: 'Juhu, Mumbai',
    rating: 4.97,
    reviewsCount: 165,
    specialty: 'Maternity, Newborn & Family Stories',
    startingPrice: '₹5,000',
    coverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    tags: ['Natural Light', 'Baby Safe Gear', 'Posed & Lifestyle'],
    experience: '5 yrs exp',
  },
];

export default function PhotographersDirectoryPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* SEARCH & FILTER TOP BAR */}
          <div className="bg-white p-4 rounded-card-md border border-contour-subtle shadow-subtle mb-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                <MapPin className="w-4 h-4 text-brand shrink-0" />
                <input
                  type="text"
                  placeholder="City or pin code..."
                  defaultValue="All Cities (India)"
                  className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                <Camera className="w-4 h-4 text-brand shrink-0" />
                <select className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer">
                  <option value="">All Photography Genres</option>
                  <option value="portrait">Portraits & Headshots</option>
                  <option value="wedding">Weddings & Engagements</option>
                  <option value="event">Birthdays & Private Events</option>
                  <option value="commercial">Commercial & Products</option>
                  <option value="fashion">Fashion & Model Shoots</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-canvas-primary rounded-card-sm border border-contour-subtle">
                <ArrowUpDown className="w-4 h-4 text-ink-secondary shrink-0" />
                <select className="w-full bg-transparent text-sm font-semibold text-ink-primary focus:outline-none cursor-pointer">
                  <option value="rating">Sort: Highest Rated</option>
                  <option value="distance">Sort: Nearest Distance</option>
                  <option value="price_low">Sort: Price Low to High</option>
                  <option value="price_high">Sort: Price High to Low</option>
                </select>
              </div>

              <div>
                <Button className="w-full" size="md" leftIcon={<Search className="w-4 h-4" />}>
                  Search Creators
                </Button>
              </div>
            </div>
          </div>

          {/* RESULTS COUNT & META */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-bold text-ink-primary">
              Showing <span className="text-brand">6</span> Verified Photographers
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>Verified Identity Guaranteed</span>
              <ShieldCheck className="w-4 h-4 text-brand" />
            </div>
          </div>

          {/* GRID OF CREATORS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DIRECTORY_CREATORS.map((creator) => (
              <Card key={creator.id} hoverEffect className="p-0 overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Cover Photo */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-canvas-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creator.coverImage}
                      alt={creator.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="dark" size="sm">
                        {creator.experience}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-lg font-bold text-ink-primary">{creator.name}</h2>
                          <CheckCircle2 className="w-4 h-4 text-brand fill-brand-subtle" />
                        </div>
                        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-ink-muted" />
                          {creator.city}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-ink-primary bg-canvas-secondary px-2 py-0.5 rounded-full">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{creator.rating}</span>
                        <span className="text-ink-muted font-normal">({creator.reviewsCount})</span>
                      </div>
                    </div>

                    <p className="text-sm text-ink-secondary font-medium">
                      {creator.specialty}
                    </p>

                    {/* Tag Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {creator.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-card-sm text-[11px] font-medium bg-canvas-secondary text-ink-secondary border border-contour-subtle"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="p-5 pt-3 border-t border-contour-subtle flex items-center justify-between bg-canvas-primary/30">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-ink-muted">Packages from</p>
                    <p className="text-lg font-extrabold text-ink-primary">{creator.startingPrice}</p>
                  </div>

                  <Link
                    href={`/photographers/${creator.id}`}
                    className="inline-flex items-center px-4 py-2 rounded-card-sm text-xs font-bold bg-brand hover:bg-brand-hover text-white transition-colors"
                  >
                    View Packages
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
