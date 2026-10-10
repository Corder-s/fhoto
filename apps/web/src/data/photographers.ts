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
  categories: ('portraits' | 'reels' | 'couples' | 'events')[];
  startingPriceInr: number;
  availabilityStatus: 'Available Today' | 'Available This Week' | 'Booking Fast';
  experienceYears: number;
  cameraGear: string;
  specialties: string[];
  tagline: string;
  bio: string;
  portfolioPreviews: string[];
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
    id: 'pro-kabir',
    name: 'Kabir Varma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Delhi NCR',
    locationArea: 'Hauz Khas, New Delhi',
    rating: 4.96,
    reviewCount: 148,
    categories: ['portraits', 'couples'],
    startingPriceInr: 4500,
    availabilityStatus: 'Available Today',
    experienceYears: 8,
    cameraGear: 'Sony A7 IV & A7R V • GM 85mm f/1.4 • Profoto B10X',
    specialties: ['Editorial Portraits', 'Executive Headshots', 'Studio Lighting', 'Brand Lookbooks'],
    tagline: 'Refined editorial portraits & artistic character studies',
    bio: 'Kabir is a Delhi-based editorial and portrait photographer with 8+ years experience. Known for his mastery of natural and sculpted studio light, he has worked with startup founders, actors, and publications across Delhi NCR and Mumbai.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    ],
    fullPortfolio: [
      {
        id: 'img-k1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
        title: 'Editorial Natural Light Portrait',
        category: 'Portraits',
      },
      {
        id: 'img-k2',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
        title: 'Monochrome Character Study',
        category: 'Portraits',
      },
      {
        id: 'img-k3',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
        title: 'Outdoor Golden Hour Session',
        category: 'Portraits',
      },
      {
        id: 'img-k4',
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
        title: 'Studio Executive Branding',
        category: 'Portraits',
      },
      {
        id: 'img-k5',
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80',
        title: 'Lifestyle Editorial Series',
        category: 'Couples',
      },
      {
        id: 'img-k6',
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
        title: 'High-Contrast Studio Headshot',
        category: 'Portraits',
      },
    ],
    servicePackages: [
      {
        id: 'pkg-k1',
        name: 'Essential Portrait',
        duration: '1 Hour',
        photos: '15 Edited High-Res Photos',
        turnaround: '48 Hour Delivery',
        priceInr: 4500,
        isPopular: false,
        features: ['1 Location / Studio', '15 Color-Graded Photos', 'Online 4K Gallery', 'Shoot-Start OTP Handshake'],
      },
      {
        id: 'pkg-k2',
        name: 'Signature Editorial',
        duration: '2.5 Hours',
        photos: '35 Edited High-Res Photos + RAW files',
        turnaround: '24 Hour Priority Delivery',
        priceInr: 7500,
        isPopular: true,
        features: ['Up to 2 Locations', '35 Retouched High-Res Photos', 'All RAW Files Included', 'Priority 24h Cloud Delivery', 'Escrow Guarantee'],
      },
      {
        id: 'pkg-k3',
        name: 'Full Day Campaign',
        duration: '5 Hours Half-Day',
        photos: '75 Edited High-Res Photos + Lighting Setup',
        turnaround: '48 Hour Delivery',
        priceInr: 14000,
        isPopular: false,
        features: ['Complete Portable Lighting Kit', 'Multiple Wardrobe Changes', 'Commercial Usage Rights', 'Full High-Res ZIP Export'],
      },
    ],
    reviews: [
      {
        id: 'rev-k1',
        clientName: 'Aarav Sharma',
        clientLocation: 'New Delhi',
        date: 'October 2, 2026',
        rating: 5,
        sessionType: 'Executive Headshots',
        comment: 'Kabir made the entire shoot effortless. The lighting in Lodhi Art District was stunning, and I had my full retouched gallery within 24 hours. The OTP verification at shoot arrival was seamless.',
      },
      {
        id: 'rev-k2',
        clientName: 'Pooja Narang',
        clientLocation: 'Gurugram',
        date: 'September 20, 2026',
        rating: 5,
        sessionType: 'Personal Branding',
        comment: 'Super professional! Directed my poses effortlessly and captured genuine expressions. Highly recommend the Signature package.',
      },
    ],
  },
  {
    id: 'pro-ananya',
    name: 'Ananya Deshmukh',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Mumbai',
    locationArea: 'Bandra West, Mumbai',
    rating: 4.98,
    reviewCount: 215,
    categories: ['couples', 'events'],
    startingPriceInr: 8000,
    availabilityStatus: 'Available This Week',
    experienceYears: 10,
    cameraGear: 'Canon R5 & R6 II • RF 28-70mm f/2 • DJI Mavic 3 Drone',
    specialties: ['Candid Wedding Stories', 'Pre-Wedding Love Stories', 'Drone Aerials', 'Emotional Documentary'],
    tagline: 'Candid wedding stories & intimate couple celebrations',
    bio: 'Ananya is an award-winning wedding and couple documentarian in Mumbai. With a decade behind the camera, she excels at capturing unscripted tears, laughter, and tender glances with cinematic warmth.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80',
    ],
    fullPortfolio: [
      {
        id: 'img-a1',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        title: 'Sunset Mandap Ceremony',
        category: 'Couples',
      },
      {
        id: 'img-a2',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        title: 'Unscripted Laughter by the Shore',
        category: 'Couples',
      },
      {
        id: 'img-a3',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
        title: 'Vibrant Haldi Festivity',
        category: 'Events',
      },
      {
        id: 'img-a4',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
        title: 'Heritage Courtyard Couple Session',
        category: 'Couples',
      },
      {
        id: 'img-a5',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
        title: 'Candid Sangeet Dance Performance',
        category: 'Events',
      },
      {
        id: 'img-a6',
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
        title: 'Golden Hour Pre-Wedding Walk',
        category: 'Couples',
      },
    ],
    servicePackages: [
      {
        id: 'pkg-a1',
        name: 'Pre-Wedding Mini',
        duration: '2 Hours',
        photos: '25 Edited High-Res Photos',
        turnaround: '48 Hour Delivery',
        priceInr: 8000,
        isPopular: false,
        features: ['1 Scenic Outdoor Location', '25 Handcrafted Edits', 'Web Gallery + Cloud Download', 'OTP Shoot Verification'],
      },
      {
        id: 'pkg-a2',
        name: 'Signature Couple Story',
        duration: '4 Hours',
        photos: '60 Edited High-Res Photos + 4K Teaser',
        turnaround: '72 Hour Delivery',
        priceInr: 15000,
        isPopular: true,
        features: ['Multiple Locations across Mumbai', 'Drone Aerial Perspectives Included', '60 Edited High-Res Photos', '1-Min 4K Cinematic Reel'],
      },
      {
        id: 'pkg-a3',
        name: 'Full Event Celebration',
        duration: '6 Hours',
        photos: '120 Edited Photos + Full RAW Archive',
        turnaround: '5 Day Delivery',
        priceInr: 25000,
        isPopular: false,
        features: ['Lead Photographer + Assistant', '120 Curated High-Res Deliverables', 'RAW Photo Archive Included', 'Print-Ready Digital Files'],
      },
    ],
    reviews: [
      {
        id: 'rev-a1',
        clientName: 'Siddharth & Rhea',
        clientLocation: 'Bandra, Mumbai',
        date: 'September 28, 2026',
        rating: 5,
        sessionType: 'Pre-Wedding Shoot',
        comment: 'Ananya captured the warmth and laughter between us without any awkward posing. The photos look like still frames from a film.',
      },
      {
        id: 'rev-a2',
        clientName: 'Kavita Joshi',
        clientLocation: 'Worli, Mumbai',
        date: 'August 14, 2026',
        rating: 5,
        sessionType: 'Intimate Engagement',
        comment: 'Remarkable eye for detail! Her communication before the shoot and prompt gallery delivery made everything seamless.',
      },
    ],
  },
  {
    id: 'pro-arjun',
    name: 'Arjun Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Bengaluru',
    locationArea: 'Indiranagar, Bengaluru',
    rating: 4.93,
    reviewCount: 92,
    categories: ['reels', 'portraits'],
    startingPriceInr: 5000,
    availabilityStatus: 'Available Today',
    experienceYears: 6,
    cameraGear: 'Sony FX3 Cinema Line • DJI RS3 Pro Gimbal • Sennheiser Wireless Mic',
    specialties: ['4K Vertical Reels', 'Lifestyle Content', 'Podcast & YouTube Video', 'Speed Retouching'],
    tagline: 'Cinematic 4K creator reels, YouTube branding & dynamic video',
    bio: 'Arjun creates vertical lifestyle cinema and creator content that converts. Based in Bengaluru’s startup corridor, he helps founders, fashion creators, and food venues create thumb-stopping reels.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    ],
    fullPortfolio: [
      {
        id: 'img-ar1',
        url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
        title: 'Artisan Cafe Reel Production',
        category: 'Reels',
      },
      {
        id: 'img-ar2',
        url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
        title: 'Urban Streetwear Lookbook',
        category: 'Portraits',
      },
      {
        id: 'img-ar3',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        title: 'Studio Creator Recording',
        category: 'Reels',
      },
      {
        id: 'img-ar4',
        url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
        title: 'Outdoor Creator Walkthrough',
        category: 'Reels',
      },
    ],
    servicePackages: [
      {
        id: 'pkg-ar1',
        name: 'Creator Sprint',
        duration: '1.5 Hours',
        photos: '3 Edited 4K Reels + 10 High-Res Photos',
        turnaround: '24 Hour Delivery',
        priceInr: 5000,
        isPopular: true,
        features: ['3 Color-Graded 4K Vertical Reels', 'Audio Cleanup & Sound Design', '10 Static Thumbnail Photos', 'Same-Day Fast Turnaround'],
      },
      {
        id: 'pkg-ar2',
        name: 'Brand Content Bundle',
        duration: '3.5 Hours',
        photos: '8 Edited 4K Reels + 25 Photos',
        turnaround: '48 Hour Delivery',
        priceInr: 11000,
        isPopular: false,
        features: ['Up to 8 Social Media Cutdowns', 'B-Roll Footage Archive', '25 Curated High-Res Photos', 'Storyboards & Concept Direction'],
      },
    ],
    reviews: [
      {
        id: 'rev-ar1',
        clientName: 'Nikhil R.',
        clientLocation: 'Indiranagar, Bengaluru',
        date: 'October 5, 2026',
        rating: 5,
        sessionType: 'Cafe Branding Reel',
        comment: 'Arjun delivered 3 incredible 4K reels within 24 hours. The motion tracking and music pacing were spot-on.',
      },
    ],
  },
  {
    id: 'pro-tanvi',
    name: 'Tanvi Malik',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Delhi NCR',
    locationArea: 'Cyber City, Gurugram',
    rating: 4.95,
    reviewCount: 84,
    categories: ['portraits', 'events'],
    startingPriceInr: 6000,
    availabilityStatus: 'Booking Fast',
    experienceYears: 7,
    cameraGear: 'Nikon Z9 & Z8 • 50mm f/1.2 S • Nanlite PavoTubes',
    specialties: ['High Fashion Lookbooks', 'Model Portfolios', 'Corporate Galas', 'Magazine Spreads'],
    tagline: 'High-fashion lookbooks, model testing & brand events',
    bio: 'Tanvi is a fashion and event photographer trained at NIFT. She blends commercial precision with high-impact color aesthetics for agencies, designer boutiques, and corporate events across Gurugram and Delhi.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    ],
    fullPortfolio: [
      {
        id: 'img-t1',
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
        title: 'Haute Couture Studio Editorial',
        category: 'Portraits',
      },
      {
        id: 'img-t2',
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
        title: 'Celebrity Gala Event Stage',
        category: 'Events',
      },
      {
        id: 'img-t3',
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
        title: 'Summer Fashion Lookbook',
        category: 'Portraits',
      },
      {
        id: 'img-t4',
        url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
        title: 'Bohemian Outdoor Portrait Series',
        category: 'Portraits',
      },
    ],
    servicePackages: [
      {
        id: 'pkg-t1',
        name: 'Model Comp Card',
        duration: '2 Hours',
        photos: '20 Retouched Photos',
        turnaround: '48 Hour Delivery',
        priceInr: 6000,
        isPopular: true,
        features: ['3 Wardrobe Changes', '20 Agency-Ready Retouched Images', 'Clean Studio Backdrops', 'Digital Composite Card'],
      },
      {
        id: 'pkg-t2',
        name: 'Event & Gala Coverage',
        duration: '4 Hours',
        photos: '80 Curated Photos',
        turnaround: '3 Day Delivery',
        priceInr: 12000,
        isPopular: false,
        features: ['Step-and-Repeat Red Carpet', 'Keynote & Candid Guest Photos', 'High-Res Download Archive', 'Fast Social Media Highlights in 6 Hours'],
      },
    ],
    reviews: [
      {
        id: 'rev-t1',
        clientName: 'Shalini Verma',
        clientLocation: 'Gurugram',
        date: 'September 12, 2026',
        rating: 5,
        sessionType: 'Fashion Lookbook',
        comment: 'Tanvi had amazing art direction ideas for our new clothing line. Her lighting brought out every fabric texture perfectly.',
      },
    ],
  },
  {
    id: 'pro-rohan',
    name: 'Rohan Sengupta',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80',
    isVerified: true,
    locationCity: 'Bengaluru',
    locationArea: 'Koramangala, Bengaluru',
    rating: 4.92,
    reviewCount: 94,
    categories: ['events', 'portraits'],
    startingPriceInr: 3500,
    availabilityStatus: 'Available Today',
    experienceYears: 6,
    cameraGear: 'Fujifilm X-T5 • 56mm f/1.2 • Godox AD200 Pro',
    specialties: ['Artisan Culinary & Cafe', 'Cocktail Bar Atmosphere', 'Event Socials', 'Analog Color Tones'],
    tagline: 'Culinary, cafes & vibrant birthday event celebrations',
    bio: 'Rohan specializes in warm, nostalgic editorial imagery for coffee roasters, gourmet restaurants, and private birthday celebrations across Bengaluru.',
    portfolioPreviews: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    ],
    fullPortfolio: [
      {
        id: 'img-r1',
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        title: 'Pour-Over Artisan Coffee Still',
        category: 'Events',
      },
      {
        id: 'img-r2',
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        title: 'Rustic Brunch Table Setting',
        category: 'Events',
      },
    ],
    servicePackages: [
      {
        id: 'pkg-r1',
        name: 'Event / Cafe Starter',
        duration: '1 Hour',
        photos: '18 Edited Photos',
        turnaround: '24 Hour Delivery',
        priceInr: 3500,
        isPopular: true,
        features: ['1 Venue Location', '18 Color-Toned High-Res Files', 'Cloud Proofing Gallery', 'Next-Day Delivery'],
      },
    ],
    reviews: [
      {
        id: 'rev-r1',
        clientName: 'Aditi Nair',
        clientLocation: 'Bengaluru',
        date: 'October 1, 2026',
        rating: 5,
        sessionType: 'Birthday Celebration',
        comment: 'Rohan captured the cozy vibes of our rooftop birthday party without getting in the way of guests. Loved the warm film-like colors.',
      },
    ],
  },
];
