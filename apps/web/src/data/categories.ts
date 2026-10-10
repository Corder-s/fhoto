export interface PhotographyCategory {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  tagline: string;
  startingPriceInr: number;
  creatorsCount: number;
  imageUrl: string;
}

export const SAMPLE_CATEGORIES: PhotographyCategory[] = [
  {
    id: 'cat-portraits',
    slug: 'portraits',
    title: 'Portraits',
    shortDescription: 'Studio portraits, corporate headshots & personal branding.',
    tagline: 'Refined personal & executive aesthetics',
    startingPriceInr: 3500,
    creatorsCount: 320,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-reels',
    slug: 'reels',
    title: 'Reels and creators',
    shortDescription: 'Cinematic 4K short-form video, lifestyle reels & TikToks.',
    tagline: 'High-energy content built for engagement',
    startingPriceInr: 4500,
    creatorsCount: 210,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-couples',
    slug: 'couples',
    title: 'Couples',
    shortDescription: 'Pre-weddings, candid engagements & milestone anniversaries.',
    tagline: 'Authentic love stories preserved forever',
    startingPriceInr: 6000,
    creatorsCount: 450,
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cat-events',
    slug: 'events',
    title: 'Events',
    shortDescription: 'Private birthdays, celebratory parties & live concerts.',
    tagline: 'Capture the spontaneous energy of the crowd',
    startingPriceInr: 3000,
    creatorsCount: 280,
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  },
];
