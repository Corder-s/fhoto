export interface SamplePhotographer {
  id: string;
  name: string;
  avatarUrl: string;
  isVerified: boolean;
  locationCity: string;
  locationArea: string;
  rating: number;
  reviewCount: number;
  categories: ('portraits' | 'reels' | 'couples' | 'events')[];
  startingPriceInr: number;
  availabilityStatus: 'Available Today' | 'Available This Week' | 'Booking Fast';
  experienceYears: number;
  cameraGear: string;
  portfolioPreviews: string[];
  tagline: string;
}

export const SAMPLE_PHOTOGRAPHERS: SamplePhotographer[] = [
  {
    id: 'pro-kabir',
    name: 'Kabir Varma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    locationCity: 'Delhi NCR',
    locationArea: 'Hauz Khas, New Delhi',
    rating: 4.96,
    reviewCount: 148,
    categories: ['portraits', 'couples'],
    startingPriceInr: 4500,
    availabilityStatus: 'Available Today',
    experienceYears: 8,
    cameraGear: 'Sony A7 IV • 85mm GM',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    ],
    tagline: 'Refined editorial portraits & artistic character studies',
  },
  {
    id: 'pro-ananya',
    name: 'Ananya Deshmukh',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    locationCity: 'Mumbai',
    locationArea: 'Bandra West, Mumbai',
    rating: 4.98,
    reviewCount: 215,
    categories: ['couples', 'events'],
    startingPriceInr: 8000,
    availabilityStatus: 'Available This Week',
    experienceYears: 10,
    cameraGear: 'Canon R5 • 28-70mm f/2',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80',
    ],
    tagline: 'Candid wedding stories & intimate couple celebrations',
  },
  {
    id: 'pro-arjun',
    name: 'Arjun Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    locationCity: 'Bengaluru',
    locationArea: 'Indiranagar, Bengaluru',
    rating: 4.93,
    reviewCount: 92,
    categories: ['reels', 'portraits'],
    startingPriceInr: 5000,
    availabilityStatus: 'Available Today',
    experienceYears: 6,
    cameraGear: 'Sony FX3 Cinema • Ronin RS3',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    ],
    tagline: 'Cinematic 4K creator reels, YouTube branding & dynamic video',
  },
  {
    id: 'pro-tanvi',
    name: 'Tanvi Malik',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    isVerified: true,
    locationCity: 'Delhi NCR',
    locationArea: 'Cyber City, Gurugram',
    rating: 4.95,
    reviewCount: 84,
    categories: ['portraits', 'events'],
    startingPriceInr: 6000,
    availabilityStatus: 'Booking Fast',
    experienceYears: 7,
    cameraGear: 'Nikon Z9 • 50mm f/1.2 S',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    ],
    tagline: 'High-fashion lookbooks, model testing & brand events',
  },
];
