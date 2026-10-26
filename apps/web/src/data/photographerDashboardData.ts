export interface PhotographerProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  city: string;
  serviceArea: string[];
  avatar: string;
  bio: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  completedShoots: number;
  verificationStatus: 'not_submitted' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'additional_info';
  profileCompletion: number;
  equipment: {
    cameras: string[];
    lenses: string[];
    lighting: string[];
    accessories: string[];
  };
  languages: string[];
}

export type BookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'ARRIVED_AT_VENUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface PhotographerBooking {
  id: string;
  rawId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  category: string;
  packageTitle: string;
  date: string;
  timeSlot: string;
  duration: string;
  venueAddress: string;
  notes?: string;
  grossAmount: number; // in INR
  netEarnings: number; // 80% take rate
  platformFee: number; // 20%
  status: BookingStatus;
  startOtp: string; // 6-digit verification code
  photosUploaded?: boolean;
  cancellationReason?: string;
  createdAt: string;
  paymentStatus?: 'unpaid' | 'paid' | 'partially_paid' | 'refunded' | 'pending';
  payoutStatus?: 'pending' | 'in_escrow' | 'released' | 'refunded';
  pricingBreakdown?: any;
}

export interface PhotographerServicePackage {
  id: string;
  title: string;
  category: 'Portrait' | 'Reels & Creator' | 'Couple' | 'Events' | 'Product & Culinary';
  description: string;
  durationHours: number;
  priceInr: number;
  deliverables: string[];
  additionalHourRateInr: number;
  isActive: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  isCover: boolean;
  aspectRatio?: string;
  uploadedAt: string;
  tags: string[];
}

export interface PayoutTransaction {
  id: string;
  reference: string;
  amountInr: number;
  date: string;
  method: 'UPI' | 'NEFT / IMPS';
  destinationAccount: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING';
  bookingsCount: number;
}

export interface PhotographerReviewItem {
  id: string;
  customerName: string;
  avatar?: string;
  rating: number;
  date: string;
  category: string;
  comment: string;
  response?: {
    text: string;
    respondedAt: string;
  };
}

export const INITIAL_PHOTOGRAPHER_PROFILE: PhotographerProfile = {
  id: 'pro-aman',
  name: 'Aman Sharma',
  handle: '@amansharmaphoto',
  email: 'aman.sharma@snapshoot.in',
  phone: '+91 98101 23456',
  city: 'Greater Noida',
  serviceArea: ['Greater Noida, UP', 'Noida Expressway', 'South Delhi', 'Gurugram Cyber Hub'],
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  bio: 'Visual storyteller with 6+ years documenting editorial portraits, intimate couple stories, and dynamic social media content across Greater Noida and Delhi NCR. Trained at Light & Life Academy.',
  experienceYears: 6,
  rating: 4.96,
  reviewCount: 148,
  completedShoots: 148,
  verificationStatus: 'approved',
  profileCompletion: 85,
  equipment: {
    cameras: ['Sony A7 IV (Dual Slot)', 'Sony FX3 Cinema Line'],
    lenses: ['Sony FE 24-70mm f/2.8 GM II', 'Sony FE 85mm f/1.4 GM', 'Sony FE 35mm f/1.4 GM'],
    lighting: ['Godox AD200 Pro Strobe', 'Aputure Amaran 100x Bi-Color', 'Octabox 90cm Diffuser'],
    accessories: ['DJI Ronin RS3 Gimbal', 'Rode Wireless PRO Mic', 'Reflector 5-in-1']
  },
  languages: ['English', 'Hindi', 'Punjabi']
};

export const INITIAL_BOOKINGS: PhotographerBooking[] = [
  {
    id: 'SNP-2026-98124',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98710 44219',
    customerEmail: 'aarav.sharma@example.com',
    category: 'Portrait Photography',
    packageTitle: 'Editorial Portrait & Headshots',
    date: 'Today',
    timeSlot: '04:00 PM - 06:30 PM',
    duration: '2.5 Hours',
    venueAddress: 'Lodhi Art District, Block 14, New Delhi',
    notes: 'Natural light session followed by golden hour street portraits. Seeking corporate LinkedIn + aesthetic portfolio portraits.',
    grossAmount: 7500,
    netEarnings: 6000,
    platformFee: 1500,
    status: 'ARRIVED_AT_VENUE',
    startOtp: '482910',
    photosUploaded: false,
    createdAt: '2026-10-09'
  },
  {
    id: 'SNP-2026-98119',
    customerName: 'Meera Kapoor',
    customerPhone: '+91 98112 55890',
    customerEmail: 'meera.k@lifestyle.com',
    category: 'Reels & Creator',
    packageTitle: 'Fashion Creator Reel Suite',
    date: 'Tomorrow',
    timeSlot: '11:00 AM - 02:00 PM',
    duration: '3 Hours',
    venueAddress: 'DLF CyberHub, Amphitheatre Area, Gurugram',
    notes: 'Shooting 4 transitional outfit reels for autumn fashion campaign. Need quick vertical framing.',
    grossAmount: 9000,
    netEarnings: 7200,
    platformFee: 1800,
    status: 'CONFIRMED',
    startOtp: '719304',
    photosUploaded: false,
    createdAt: '2026-10-08'
  },
  {
    id: 'SNP-2026-98105',
    customerName: 'Rohan Deshmukh',
    customerPhone: '+91 99203 11847',
    customerEmail: 'rohan@bluetokaicoffee.com',
    category: 'Product & Culinary',
    packageTitle: 'Artisanal Cafe Culinary Shoot',
    date: 'Yesterday',
    timeSlot: '02:00 PM - 04:00 PM',
    duration: '2 Hours',
    venueAddress: 'Blue Tokai Coffee Roasters, Saket District Centre, New Delhi',
    notes: 'Latte art pours, manual brew bar shots, and interior mood pictures for new menu launch.',
    grossAmount: 6250,
    netEarnings: 5000,
    platformFee: 1250,
    status: 'COMPLETED',
    startOtp: '629401',
    photosUploaded: false,
    createdAt: '2026-10-07'
  },
  {
    id: 'SNP-2026-98088',
    customerName: 'Tanya Sengupta',
    customerPhone: '+91 97118 63290',
    customerEmail: 'tanya.sengupta@gmail.com',
    category: 'Couple Photography',
    packageTitle: 'Morning Golden Hour Couple Story',
    date: '18 Oct 2026',
    timeSlot: '06:30 AM - 10:30 AM',
    duration: '4 Hours',
    venueAddress: 'Sunder Nursery Heritage Park, Nizamuddin, New Delhi',
    notes: 'Engagement photo story. Floral arches and Mughal tomb backdrop. Casual + ethnic attire changes.',
    grossAmount: 15000,
    netEarnings: 12000,
    platformFee: 3000,
    status: 'CONFIRMED',
    startOtp: '394812',
    photosUploaded: false,
    createdAt: '2026-10-06'
  },
  {
    id: 'SNP-2026-98050',
    customerName: 'Vikram Joshi',
    customerPhone: '+91 98451 90234',
    customerEmail: 'vikram.joshi@consulting.in',
    category: 'Portrait Photography',
    packageTitle: 'Executive Headshot Quick Session',
    date: '12 Oct 2026',
    timeSlot: '10:00 AM - 11:30 AM',
    duration: '1.5 Hours',
    venueAddress: 'Connaught Place Inner Circle, Near Regal, New Delhi',
    notes: 'Clean studio-feel portraits outdoors in CP colosseum arches.',
    grossAmount: 4500,
    netEarnings: 3600,
    platformFee: 900,
    status: 'REQUESTED',
    startOtp: '849102',
    photosUploaded: false,
    createdAt: '2026-10-10'
  },
  {
    id: 'SNP-2026-97992',
    customerName: 'Ananya Roy',
    customerPhone: '+91 98210 33451',
    customerEmail: 'ananya.roy@style.in',
    category: 'Portrait Photography',
    packageTitle: 'Fashion Lookbook Editorial',
    date: '02 Oct 2026',
    timeSlot: '03:00 PM - 06:00 PM',
    duration: '3 Hours',
    venueAddress: 'Hauz Khas Village Fort Complex, New Delhi',
    notes: 'Delivered and approved by client. 45 high-res retouched images released.',
    grossAmount: 10000,
    netEarnings: 8000,
    platformFee: 2000,
    status: 'COMPLETED',
    startOtp: '912845',
    photosUploaded: true,
    createdAt: '2026-09-30'
  },
  {
    id: 'SNP-2026-97810',
    customerName: 'Kabir Mehta',
    customerPhone: '+91 99100 88219',
    customerEmail: 'kabir@eventhub.com',
    category: 'Events',
    packageTitle: 'Evening Rooftop Reception',
    date: '25 Sep 2026',
    timeSlot: '07:00 PM - 12:00 AM',
    duration: '5 Hours',
    venueAddress: 'Andaz Delhi, Aerocity, New Delhi',
    notes: 'Client rescheduled event to next month due to venue maintenance.',
    grossAmount: 18000,
    netEarnings: 14400,
    platformFee: 3600,
    status: 'CANCELLED',
    startOtp: '110934',
    photosUploaded: false,
    createdAt: '2026-09-20'
  }
];

export const INITIAL_SERVICES: PhotographerServicePackage[] = [
  {
    id: 'srv-1',
    title: 'Individual Editorial Portrait Session',
    category: 'Portrait',
    description: 'High-end portraiture for personal branding, dating profiles, actors, and executives. Includes lighting setup and color grading.',
    durationHours: 1.5,
    priceInr: 3500,
    deliverables: [
      '25 High-Resolution Color-Graded Photos',
      '5 Advanced Skin Retouched Master Portraits',
      'Private Web Proofing Gallery',
      '48-Hour Delivery Turnaround'
    ],
    additionalHourRateInr: 1500,
    isActive: true
  },
  {
    id: 'srv-2',
    title: 'Vertical Video Reels & Creator Shoot',
    category: 'Reels & Creator',
    description: 'Designed specifically for Instagram Reels, YouTube Shorts, and TikTok. 4K vertical footage captured with professional gimbal stabilization.',
    durationHours: 2,
    priceInr: 4500,
    deliverables: [
      '3 Fully Edited 4K Vertical Reels (with Trending Audio)',
      'All B-Roll Stills (RAW + JPEG)',
      'Audio sync with Rode wireless mics',
      '24-Hour Express Delivery'
    ],
    additionalHourRateInr: 1800,
    isActive: true
  },
  {
    id: 'srv-3',
    title: 'Cinematic Couple & Pre-Wedding Session',
    category: 'Couple',
    description: 'Romantic, candid storytelling in scenic heritage parks or urban backdrops across Delhi NCR. Includes outfit consultation.',
    durationHours: 2.5,
    priceInr: 6000,
    deliverables: [
      '40 Edited High-Res Photos',
      '1 Cinematic 60-Second Video Teaser',
      'High-Speed Cloud Download Link',
      'Print-Ready 300 DPI Export'
    ],
    additionalHourRateInr: 2000,
    isActive: true
  },
  {
    id: 'srv-4',
    title: 'Intimate Event & Celebration Coverage',
    category: 'Events',
    description: 'Birthdays, anniversaries, corporate cocktail evenings, and gallery openings. Full candid and guest portrait coverage.',
    durationHours: 4,
    priceInr: 9500,
    deliverables: [
      '100+ Master Edited High-Res Photos',
      'Same-Night 10-Photo Sneak Peek',
      'Full Event Photo Timeline',
      'Full Commercial Usage Rights'
    ],
    additionalHourRateInr: 2200,
    isActive: true
  },
  {
    id: 'srv-5',
    title: 'Artisanal Cafe & Culinary Catalog',
    category: 'Product & Culinary',
    description: 'Mouthwatering menu styling, beverage pours, and dining ambiance shots tailored for Swiggy, Zomato, and social media.',
    durationHours: 2,
    priceInr: 5000,
    deliverables: [
      '30 Curated Dish & Beverage Shots',
      'Overhead Flat-Lays + 45-Degree Hero Angles',
      'Menu-Optimized Square & Vertical Crops',
      'Color balanced for food vibrancy'
    ],
    additionalHourRateInr: 1800,
    isActive: true
  }
];

export const INITIAL_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'port-1',
    title: 'Editorial Silhouette in Sunder Nursery',
    category: 'Portrait',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    isCover: true,
    uploadedAt: '2026-09-15',
    tags: ['Golden Hour', '85mm f/1.4', 'Warm Tones']
  },
  {
    id: 'port-2',
    title: 'Monochrome Street Portrait at Lodhi',
    category: 'Portrait',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
    isCover: false,
    uploadedAt: '2026-09-20',
    tags: ['Black & White', 'Architectural', 'Natural Light']
  },
  {
    id: 'port-3',
    title: 'Neon Glow Creator Reel Still',
    category: 'Reels & Creator',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
    isCover: false,
    uploadedAt: '2026-09-25',
    tags: ['Night Shoot', 'CyberHub', 'Vibrant']
  },
  {
    id: 'port-4',
    title: 'Intimate Laughs by the Mughal Arches',
    category: 'Couple',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1000&q=80',
    isCover: false,
    uploadedAt: '2026-09-28',
    tags: ['Pre-Wedding', 'Candid', 'Warm Cream']
  },
  {
    id: 'port-5',
    title: 'Espresso Extraction & Foam Art',
    category: 'Product & Culinary',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
    isCover: false,
    uploadedAt: '2026-10-01',
    tags: ['Cafe', 'Culinary', 'Macro']
  },
  {
    id: 'port-6',
    title: 'Golden Hour Laughs at Terrace Cocktail',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    isCover: false,
    uploadedAt: '2026-10-04',
    tags: ['Reception', 'Ambient Light', 'Celebration']
  }
];

export const INITIAL_PAYOUTS: PayoutTransaction[] = [
  {
    id: 'po-1',
    reference: 'PAY-HDFC-991823',
    amountInr: 32000,
    date: '05 Oct 2026',
    method: 'UPI',
    destinationAccount: 'rahulverma@okhdfcbank',
    status: 'COMPLETED',
    bookingsCount: 4
  },
  {
    id: 'po-2',
    reference: 'PAY-HDFC-984102',
    amountInr: 28400,
    date: '28 Sep 2026',
    method: 'UPI',
    destinationAccount: 'rahulverma@okhdfcbank',
    status: 'COMPLETED',
    bookingsCount: 3
  },
  {
    id: 'po-3',
    reference: 'PAY-NEFT-976211',
    amountInr: 38800,
    date: '15 Sep 2026',
    method: 'NEFT / IMPS',
    destinationAccount: 'HDFC Bank ••••4182',
    status: 'COMPLETED',
    bookingsCount: 5
  }
];

export const INITIAL_REVIEWS: PhotographerReviewItem[] = [
  {
    id: 'rev-1',
    customerName: 'Pooja Iyer',
    rating: 5,
    date: '04 Oct 2026',
    category: 'Editorial Portrait',
    comment: 'Rahul was punctual, deeply professional, and gave amazing direction for poses! The Lodhi Art District shots looked straight out of Vogue India. Delighted with the speed of turnaround.',
    response: {
      text: 'Thank you so much Pooja! You brought such vibrant energy to the shoot. Looking forward to our next collaboration.',
      respondedAt: '05 Oct 2026'
    }
  },
  {
    id: 'rev-2',
    customerName: 'Karan Malhotra',
    rating: 5,
    date: '29 Sep 2026',
    category: 'Reels & Creator',
    comment: 'The 4K vertical reels captured with the gimbal were crisp and ready to publish immediately. Got 120k views on my first post! 10/10 would book again.',
    response: {
      text: 'Incredible numbers on your reel, Karan! Loved working with your styling concept.',
      respondedAt: '30 Sep 2026'
    }
  },
  {
    id: 'rev-3',
    customerName: 'Sanya & Deep',
    rating: 5,
    date: '22 Sep 2026',
    category: 'Couple Photography',
    comment: 'Neither of us is naturally comfortable in front of a camera, but Rahul made us laugh and feel completely at home. The morning light at Sunder Nursery was magical.',
    response: {
      text: 'You two were an absolute joy to document! Wishing you both a lifetime of happiness.',
      respondedAt: '23 Sep 2026'
    }
  },
  {
    id: 'rev-4',
    customerName: 'Manish Rawat',
    rating: 4,
    date: '14 Sep 2026',
    category: 'Events',
    comment: 'Great candid shots of our anniversary dinner. Captured all the family members gracefully. Delivery was on time as promised.',
    response: undefined
  }
];

export const INITIAL_AVAILABILITY = {
  isOnlineRadar: true,
  weeklySlots: [
    { day: 'Monday', enabled: true, start: '09:00', end: '19:00' },
    { day: 'Tuesday', enabled: true, start: '09:00', end: '19:00' },
    { day: 'Wednesday', enabled: true, start: '09:00', end: '19:00' },
    { day: 'Thursday', enabled: true, start: '09:00', end: '19:00' },
    { day: 'Friday', enabled: true, start: '09:00', end: '20:00' },
    { day: 'Saturday', enabled: true, start: '07:00', end: '21:00' },
    { day: 'Sunday', enabled: true, start: '07:00', end: '21:00' }
  ],
  blackoutDates: ['2026-10-24', '2026-10-25', '2026-11-01'],
  bufferHoursBetweenShoots: 1,
  maxBookingsPerDay: 3
};
