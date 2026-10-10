import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import { ArrowRight } from 'lucide-react';

const CATEGORIES_DATA = [
  {
    slug: 'portrait',
    title: 'Portraits & Headshots',
    description: 'Corporate executive headshots, personal branding, modeling comp cards, and artistic studio portraits.',
    startingPrice: '₹3,500',
    count: '320+ Creators',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'wedding',
    title: 'Weddings & Pre-Wedding',
    description: 'Candid wedding moments, cinematic pre-wedding love stories, engagement ceremonies, and reception coverage.',
    startingPrice: '₹8,000',
    count: '450+ Creators',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'event',
    title: 'Birthdays & Private Events',
    description: 'Milestone birthdays, baby showers, private anniversaries, club parties, and family reunions.',
    startingPrice: '₹3,000',
    count: '280+ Creators',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'commercial',
    title: 'Commercial & Brand Food',
    description: 'Product studio catalogs, culinary food photography for Zomato/Swiggy menus, and e-commerce lookbooks.',
    startingPrice: '₹4,500',
    count: '190+ Creators',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'real-estate',
    title: 'Real Estate & Interiors',
    description: 'Architectural photography, luxury villa showcases, Airbnb listings, and commercial real estate shoots.',
    startingPrice: '₹5,000',
    count: '140+ Creators',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'fashion',
    title: 'Fashion & Runway Lookbooks',
    description: 'Apparel lines, high-fashion editorials, designer catalogs, and boutique seasonal lookbooks.',
    startingPrice: '₹6,500',
    count: '210+ Creators',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  },
];

export default function CategoriesPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
              Creative Genres
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary">
              Photography Categories
            </h1>
            <p className="text-sm sm:text-base text-ink-secondary">
              Discover verified visual talent specialized in every style, industry, and occasion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES_DATA.map((cat) => (
              <Card key={cat.slug} hoverEffect className="p-0 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-canvas-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-ink-primary/80 backdrop-blur-md px-2.5 py-1 rounded-card-sm text-[11px] font-bold text-white">
                      {cat.count}
                    </div>
                  </div>

                  <div className="p-6 space-y-2">
                    <h2 className="text-xl font-bold text-ink-primary">{cat.title}</h2>
                    <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-contour-subtle mt-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-ink-muted">Packages from</p>
                    <p className="text-base font-extrabold text-ink-primary">{cat.startingPrice}</p>
                  </div>

                  <Link
                    href={`/photographers?category=${cat.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-hover transition-colors"
                  >
                    Explore Creators <ArrowRight className="w-3.5 h-3.5" />
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
