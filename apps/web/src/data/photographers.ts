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
    name: 'Aman Sharma',
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
  {
    id: 'pro-zoya',
    name: 'Zoya Akhtar',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'South Delhi',
    locationArea: 'Hauz Khas & Mehrauli, South Delhi',
    rating: 4.97,
    reviewCount: 184,
    categories: ['Portraits', 'Fashion', 'Reels', 'Editorial'],
    startingPriceInr: 2200,
    availabilityStatus: 'Available today',
    experienceYears: 9,
    cameraGear: 'Fujifilm GFX 100 II 102MP Medium Format • Profoto B10X Lights • 110mm f/2',
    specialties: ['High-Fashion Editorial', 'Vogue Aesthetics', 'Harsh Sunlight & Studio', 'Color Grading'],
    tagline: 'Vogue-grade fashion aesthetics, bold studio portraits & luxury brand editorials',
    bio: 'Zoya is an editorial portraitist working between Hauz Khas studios and heritage ruins, producing magazine-tier imagery with 102MP medium-format fidelity.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    ],
    collageType: 'three_column',
    collageImages: {
      col1: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      col2: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
      extraCount: 22,
      extraImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
    },
    fullPortfolio: [
      { id: 'img-z1', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', title: 'Editorial Chic in Mehrauli', category: 'Fashion' },
      { id: 'img-z2', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', title: 'Avant-Garde Studio Strobe', category: 'Portraits' },
      { id: 'img-z3', url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80', title: 'Linen Dress Movement', category: 'Fashion' },
    ],
    servicePackages: [
      { id: 'pkg-z1', name: 'Editorial Lookbook', duration: '2 Hours', photos: '20 Retouched Medium-Format Stills', turnaround: '24 Hour Delivery', priceInr: 2200, features: ['1 Studio/Outdoor Set', 'Medium Format Raw Capture', 'Color Master LUTs', 'Commercial Release'] },
      { id: 'pkg-z2', name: 'Campaign Production', duration: '4 Hours', photos: '50 Master Retouched + 3 Cinematic Reels', turnaround: '24 Hour Delivery', priceInr: 5200, isPopular: true, features: ['Studio + Location Lighting', 'Digital Tech Assistant', '3 4K Vertical Video Reels', 'Priority Escrow'] },
    ],
    reviews: [
      { id: 'rev-z1', clientName: 'Nandini Sen', clientLocation: 'Hauz Khas Village', date: 'October 8, 2026', rating: 5, sessionType: 'Fashion Editorial', comment: 'The medium format detail is breathtaking. Zoya directed lighting like a master painter.' },
    ],
  },
  {
    id: 'pro-vikram',
    name: 'Vikramaditya Rathore',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Delhi NCR',
    locationArea: 'Delhi Heritage Forts & Gurugram',
    rating: 4.95,
    reviewCount: 240,
    categories: ['Couples', 'Weddings', 'Events', 'Heritage'],
    startingPriceInr: 3500,
    availabilityStatus: 'Available this week',
    experienceYears: 11,
    cameraGear: 'Hasselblad X2D 100C • Canon R5C Cinema • DJI Inspire 3 8K Drone',
    specialties: ['Royal Heritage Weddings', '8K Aerial Drone Shots', 'Monumental Framing', 'Timeless Monochrome'],
    tagline: 'Monumental royal pre-weddings, architectural framing & aerial cinematography',
    bio: 'Vikram brings cinematic grandeur to couples and wedding parties across northern India, pairing medium-format cameras with cinema drone systems.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    ],
    collageType: 'featured_with_stack',
    collageImages: {
      main: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      stackTop: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
      stackBottom: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
      extraCount: 30,
      extraImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
    },
    fullPortfolio: [
      { id: 'img-v1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', title: 'Fortress Courtyard Pre-Wedding', category: 'Weddings' },
      { id: 'img-v2', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80', title: 'Sunset Lake Aerial 8K', category: 'Weddings' },
      { id: 'img-v3', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80', title: 'Heritage Archway Silhouette', category: 'Couples' },
    ],
    servicePackages: [
      { id: 'pkg-v1', name: 'Royal Pre-Wedding Stills', duration: '3 Hours', photos: '50 Master Edits + 4K Drone Stills', turnaround: '48 Hour Delivery', priceInr: 3500, features: ['Heritage Location Scouting', 'Hasselblad 100MP Master Capture', '4K Aerial Drone Coverage', 'Private VIP Proofing Cloud'] },
      { id: 'pkg-v2', name: 'Grand Narrative Production', duration: 'Full Day (8 Hours)', photos: '120 Handcrafted Edits + Cinema Teaser', turnaround: '72 Hour Delivery', priceInr: 8500, isPopular: true, features: ['Multi-Operator Cinema Team', '8K Drone Video Footage', 'Archival Fine-Art Print Box', 'Complete Escrow Protection'] },
    ],
    reviews: [
      { id: 'rev-v1', clientName: 'Rohan & Gayatri', clientLocation: 'New Delhi', date: 'September 28, 2026', rating: 5, sessionType: 'Royal Pre-Wedding', comment: 'Vikramaditya turned our pre-wedding shoot into a Bollywood cinematic masterwork. Simply unmatched.' },
    ],
  },
  {
    id: 'pro-ananya',
    name: 'Ananya Sen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Gurugram',
    locationArea: 'CyberHub & Golf Course Rd, Gurugram',
    rating: 4.92,
    reviewCount: 94,
    categories: ['Reels', 'Portraits', 'Lifestyle', 'Commercial'],
    startingPriceInr: 950,
    availabilityStatus: 'Available today',
    experienceYears: 5,
    cameraGear: 'Sony FX3 Cinema Rig • Sony FE 35mm f/1.4 GM • Wireless Mics',
    specialties: ['Viral 9:16 Creator Reels', 'Tech Founder Headshots', 'Warm Cinematic LUTs', 'Fast Turnaround'],
    tagline: 'High-converting Instagram reels, personal branding & modern corporate visual stories',
    bio: 'Ananya specializes in creator-first vertical video production, lifestyle portraits, and executive LinkedIn headshots across Gurugram.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    ],
    collageType: 'three_column',
    collageImages: {
      col1: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      col2: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      extraCount: 14,
      extraImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    },
    fullPortfolio: [
      { id: 'img-a1', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80', title: 'Founder Walk & Talk Video', category: 'Reels' },
      { id: 'img-a2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80', title: 'Cafe Natural Light Session', category: 'Lifestyle' },
      { id: 'img-a3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80', title: 'Tech Executive Branding', category: 'Portraits' },
    ],
    servicePackages: [
      { id: 'pkg-a1', name: 'Creator Reel Sprint', duration: '1 Hour', photos: '10 Photos + 2 Edited 9:16 Reels', turnaround: 'Same-Day Delivery (12h)', priceInr: 950, features: ['CyberHub or Studio', 'Trending Audio Sync', '4K 60fps Vertical Capture', 'Color Graded LUTs'] },
      { id: 'pkg-a2', name: 'Executive Personal Brand', duration: '2 Hours', photos: '25 Master Photos + 4 Reels', turnaround: '24 Hour Delivery', priceInr: 2100, isPopular: true, features: ['Outdoor + Office Sets', 'Audio Lav Mics Included', 'LinkedIn & Press Ready', 'Escrow Guarantee'] },
    ],
    reviews: [
      { id: 'rev-a1', clientName: 'Kunal Singhal', clientLocation: 'Gurugram', date: 'October 9, 2026', rating: 5, sessionType: 'Personal Brand & Reels', comment: 'Ananya produced 2 viral reels for my startup within 12 hours. Lightning fast and ultra creative!' },
    ],
  },
];
