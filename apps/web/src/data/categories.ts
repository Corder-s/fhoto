export interface PhotographyCategory {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  startingPriceInr: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
}

export const SAMPLE_CATEGORIES: PhotographyCategory[] = [
  {
    id: 'cat-portraits',
    slug: 'portraits',
    title: 'Portrait Session',
    subtitle: 'Individual · Professional · Lifestyle',
    shortDescription: 'Studio portraits, executive headshots, and personal lifestyle aesthetics.',
    startingPriceInr: 800,
    rating: 4.9,
    reviewCount: 320,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-reels',
    slug: 'reels',
    title: 'Creator Reels',
    subtitle: 'Social media · Content · Personal brand',
    shortDescription: 'Cinematic 4K vertical video, trending audio transitions, and B-roll.',
    startingPriceInr: 1200,
    rating: 4.8,
    reviewCount: 210,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-couples',
    slug: 'couples',
    title: 'Couple Shoot',
    subtitle: 'Pre-weddings · Love stories · Engagements',
    shortDescription: 'Intimate, candid storytelling and romantic golden-hour sessions.',
    startingPriceInr: 1500,
    rating: 4.9,
    reviewCount: 412,
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-events',
    slug: 'events',
    title: 'Events',
    subtitle: 'Weddings · Parties · Corporate',
    shortDescription: 'Comprehensive candid guest coverage, banquets, and celebrations.',
    startingPriceInr: 2500,
    rating: 4.8,
    reviewCount: 189,
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  },
];
