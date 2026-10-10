export interface PhotographerServicePackage {
  id: string;
  name: string;
  duration: string;
  photos: string;
  turnaround: string;
  priceInr: number;
  isPopular?: boolean;
  features: string[];
}

export interface PhotographerReview {
  id: string;
  clientName: string;
  clientLocation: string;
  date: string;
  rating: number;
  comment: string;
  sessionType: string;
}

export interface SamplePhotographer {
  id: string;
  name: string;
  avatarUrl: string;
  coverImageUrl: string;
  isVerified: boolean;
  locationCity: string;
  locationArea: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  startingPriceInr: number;
  availabilityStatus:
    | 'Available today'
    | 'Available this week'
    | 'Booking fast'
    | 'Available Today'
    | 'Available This Week'
    | 'Booking Fast';
  experienceYears: number;
  cameraGear: string;
  specialties: string[];
  tagline: string;
  bio: string;
  portfolioPreviews: string[];
  collageType?: 'three_column' | 'featured_with_stack';
  collageImages?: {
    main?: string;
    col1?: string;
    col2?: string;
    stackTop?: string;
    stackBottom?: string;
    extraCount: number;
    extraImage: string;
  };
  fullPortfolio: {
    id: string;
    url: string;
    title: string;
    category: string;
  }[];
  servicePackages: PhotographerServicePackage[];
  reviews: PhotographerReview[];
}

export const SAMPLE_PHOTOGRAPHERS: SamplePhotographer[] = [
  {
    id: 'pro-aman',
    name: 'Aman Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Greater Noida',
    locationArea: 'Greater Noida, UP',
    rating: 4.9,
    reviewCount: 128,
    categories: ['Portraits', 'Reels', 'Events', 'Lifestyle'],
    startingPriceInr: 800,
    availabilityStatus: 'Available this week',
    experienceYears: 6,
    cameraGear: 'Sony A7 IV • Sony FE 85mm f/1.4 GM • Godox AD200',
    specialties: ['Editorial Portraits', 'Creator Shoots', 'Outdoor Aesthetics', 'Lighting'],
    tagline: 'Natural light & outdoor editorial specialist in Greater Noida',
    bio: 'Aman captures vibrant outdoor portraits, dynamic creator reels, and intimate lifestyle sessions across Greater Noida and Delhi NCR.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    ],
    collageType: 'three_column',
    collageImages: {
      col1: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      col2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      extraCount: 12,
      extraImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    },
    fullPortfolio: [
      { id: 'img-a1', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80', title: 'Outdoor Filmmaking Rig', category: 'Reels' },
      { id: 'img-a2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', title: 'Editorial Sunlight Portrait', category: 'Portraits' },
      { id: 'img-a3', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80', title: 'Golden Hour Walk', category: 'Lifestyle' },
      { id: 'img-a4', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80', title: 'Monochrome Character', category: 'Portraits' },
    ],
    servicePackages: [
      { id: 'pkg-a1', name: 'Starter Shoot', duration: '1 Hour', photos: '15 Edited High-Res Photos', turnaround: '24 Hour Delivery', priceInr: 800, features: ['1 Location', '15 Color-Graded Photos', 'Online 4K Gallery', 'Shoot-Start OTP Handshake'] },
      { id: 'pkg-a2', name: 'Standard Creator', duration: '2 Hours', photos: '30 Edited Photos + 2 Reels', turnaround: '24 Hour Delivery', priceInr: 1600, isPopular: true, features: ['2 Locations', '30 Retouched Photos', '2 Vertical Reels', 'Escrow Guarantee'] },
    ],
    reviews: [
      { id: 'rev-a1', clientName: 'Devansh K.', clientLocation: 'Greater Noida', date: 'October 4, 2026', rating: 5, sessionType: 'Portrait Session', comment: 'Aman directed every pose with great patience. The golden hour lighting in Knowledge Park was spectacular!' },
    ],
  },
  {
    id: 'pro-riya',
    name: 'Riya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Noida',
    locationArea: 'Noida, UP',
    rating: 4.8,
    reviewCount: 96,
    categories: ['Portraits', 'Couples', 'Pre-weddings', 'Events'],
    startingPriceInr: 1200,
    availabilityStatus: 'Available today',
    experienceYears: 7,
    cameraGear: 'Canon EOS R5 • RF 50mm f/1.2L • RF 24-70mm f/2.8L',
    specialties: ['Candid Couples', 'Pre-Wedding Romance', 'Artistic Framing', 'Expressive Light'],
    tagline: 'Romantic storytelling, candid emotions & editorial portraits in Noida',
    bio: 'Riya is known for capturing genuine connection, quiet smiles, and cinematic couple narratives across Noida and Delhi.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    ],
    collageType: 'featured_with_stack',
    collageImages: {
      main: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      stackTop: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
      stackBottom: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
      extraCount: 18,
      extraImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    },
    fullPortfolio: [
      { id: 'img-r1', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80', title: 'Close-Up Beauty Portrait', category: 'Portraits' },
      { id: 'img-r2', url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80', title: 'Golden Hour Couple Laugh', category: 'Couples' },
      { id: 'img-r3', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80', title: 'Candid Engagement Moments', category: 'Couples' },
    ],
    servicePackages: [
      { id: 'pkg-r1', name: 'Couple Portrait', duration: '1.5 Hours', photos: '25 Edited Photos', turnaround: '48 Hour Delivery', priceInr: 1200, features: ['1 Outdoor Location', '25 Handcrafted Edits', 'Web Proofing Gallery', 'Mobile Wallpapers'] },
      { id: 'pkg-r2', name: 'Pre-Wedding Signature', duration: '3 Hours', photos: '50 Edited Photos + 4K Teaser', turnaround: '48 Hour Delivery', priceInr: 2800, isPopular: true, features: ['2 Outfits & Locations', '50 High-Res Edits', '60-Sec Cinematic Reel', 'Escrow Protected'] },
    ],
    reviews: [
      { id: 'rev-r1', clientName: 'Tarun & Sneha', clientLocation: 'Noida Sector 50', date: 'October 1, 2026', rating: 5, sessionType: 'Couple Shoot', comment: 'Riya made us feel completely natural. We cherish every photo she delivered!' },
    ],
  },
  {
    id: 'pro-karan',
    name: 'Karan Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Delhi NCR',
    locationArea: 'Delhi NCR',
    rating: 4.9,
    reviewCount: 112,
    categories: ['Reels', 'Events', 'Corporate', 'Products'],
    startingPriceInr: 1500,
    availabilityStatus: 'Available this week',
    experienceYears: 8,
    cameraGear: 'Sony FX3 Cinema & A7 IV • DJI RS3 Pro Gimbal • Aputure Lights',
    specialties: ['Cinematic Video', 'Event Highlights', 'Brand Products', 'Architectural Stills'],
    tagline: 'High-energy video production, corporate events & visual branding',
    bio: 'Karan is a versatile visual storyteller specializing in vibrant event coverage, commercial brand products, and dynamic social media reels.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80',
    ],
    collageType: 'featured_with_stack',
    collageImages: {
      main: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      stackTop: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      stackBottom: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
      extraCount: 15,
      extraImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    },
    fullPortfolio: [
      { id: 'img-k1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80', title: 'Cinematographer Action Still', category: 'Reels' },
      { id: 'img-k2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', title: 'Sunset Silhouette by the Water', category: 'Events' },
      { id: 'img-k3', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80', title: 'Historic Mughal Arches Story', category: 'Events' },
    ],
    servicePackages: [
      { id: 'pkg-k1', name: 'Event Basic', duration: '2 Hours', photos: '40 Edited Photos', turnaround: '24 Hour Delivery', priceInr: 1500, features: ['1 Venue', '40 Retouched Photos', 'Online Gallery', 'Verified Booking'] },
      { id: 'pkg-k2', name: 'Full Event Coverage', duration: '4 Hours', photos: '100+ Photos + Highlights Reel', turnaround: '48 Hour Delivery', priceInr: 3500, isPopular: true, features: ['Gimbal 4K Reel Included', '100+ Master Deliverables', 'RAW Photo Archive', 'Escrow Safeguard'] },
    ],
    reviews: [
      { id: 'rev-k1', clientName: 'Abhishek M.', clientLocation: 'Delhi', date: 'September 25, 2026', rating: 5, sessionType: 'Event Coverage', comment: 'Karan was energetic, fast, and delivered our company celebration highlights the very next morning.' },
    ],
  },
];
