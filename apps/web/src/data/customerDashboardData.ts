export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  avatar: string;
  memberSince: string;
}

export type CustomerBookingStatus =
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'ARRIVED_AT_VENUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PAID_ESCROW'
  | 'RELEASED'
  | 'REFUNDED'
  | 'PENDING';

export interface CustomerBooking {
  id: string;
  photographerId: string;
  photographerName: string;
  photographerAvatar: string;
  photographerRating: number;
  photographerPhone: string;
  category: string;
  packageTitle: string;
  date: string;
  timeSlot: string;
  duration: string;
  venueAddress: string;
  notes?: string;
  amountInr: number;
  status: CustomerBookingStatus;
  paymentStatus: PaymentStatus;
  startOtp: string;
  etaMinutes?: number;
  deliverablesSummary: string;
  deliveredPhotosCount?: number;
  hasReview?: boolean;
  canCancel?: boolean;
  createdAt: string;
}

export interface GalleryPhoto {
  id: string;
  bookingId: string;
  photographerName: string;
  category: string;
  url: string;
  title: string;
  aspectRatio: string;
  sizeMb: number;
  deliveredAt: string;
}

export interface CustomerPaymentRecord {
  id: string;
  bookingRef: string;
  serviceTitle: string;
  photographerName: string;
  amountInr: number;
  paymentDate: string;
  paymentMethod: string;
  status: 'ESCROW_HELD' | 'SETTLED' | 'REFUNDED';
  invoiceRef: string;
}

export interface CustomerReviewRecord {
  id: string;
  bookingRef: string;
  photographerId: string;
  photographerName: string;
  photographerAvatar: string;
  category: string;
  rating: number;
  date: string;
  comment: string;
  photographerReply?: string;
}

export interface CustomerNotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'transit' | 'delivery' | 'booking' | 'payment';
  actionHref?: string;
}

export const INITIAL_CUSTOMER_PROFILE: CustomerProfile = {
  id: 'cust-aarav',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  phone: '+91 98710 44219',
  city: 'New Delhi',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  memberSince: 'August 2026',
};

export const INITIAL_CUSTOMER_BOOKINGS: CustomerBooking[] = [
  {
    id: 'SNP-2026-98124',
    photographerId: 'pro-aman',
    photographerName: 'Aman Sharma',
    photographerAvatar: '/reference-assets/avatar_aman.jpg',
    photographerRating: 4.9,
    photographerPhone: '+91 98101 23456',
    category: 'Portrait Session',
    packageTitle: 'Signature Editorial Portrait & Headshots',
    date: 'Today',
    timeSlot: '04:00 PM - 06:30 PM',
    duration: '2.5 Hours',
    venueAddress: 'Lodhi Art District, Block 14, New Delhi',
    notes: 'Natural light session followed by golden hour street portraits.',
    amountInr: 7500,
    status: 'ARRIVED_AT_VENUE',
    paymentStatus: 'PAID_ESCROW',
    startOtp: '482910',
    etaMinutes: 0,
    deliverablesSummary: '35 Edited High-Res Photos + RAW files',
    canCancel: false,
    hasReview: false,
    createdAt: '2026-10-09',
  },
  {
    id: 'SNP-2026-98119',
    photographerId: 'pro-riya',
    photographerName: 'Riya Sharma',
    photographerAvatar: '/reference-assets/avatar_riya.jpg',
    photographerRating: 4.8,
    photographerPhone: '+91 98112 55890',
    category: 'Couple Shoot',
    packageTitle: 'Pre-Wedding Golden Hour Session',
    date: '18 Oct 2026',
    timeSlot: '06:30 AM - 09:30 AM',
    duration: '3 Hours',
    venueAddress: 'Sunder Nursery Heritage Park, Nizamuddin, New Delhi',
    notes: 'Floral arches and Mughal tomb backdrops.',
    amountInr: 2800,
    status: 'CONFIRMED',
    paymentStatus: 'PAID_ESCROW',
    startOtp: '719304',
    deliverablesSummary: '50 Edited Photos + 60-Sec Cinematic Reel',
    canCancel: true,
    hasReview: false,
    createdAt: '2026-10-08',
  },
  {
    id: 'SNP-2026-98042',
    photographerId: 'pro-karan',
    photographerName: 'Karan Mehta',
    photographerAvatar: '/reference-assets/avatar_karan.jpg',
    photographerRating: 4.9,
    photographerPhone: '+91 99100 88219',
    category: 'Creator Reels',
    packageTitle: '4K Vertical Video Creator Suite',
    date: '28 Sep 2026',
    timeSlot: '11:00 AM - 01:00 PM',
    duration: '2 Hours',
    venueAddress: 'DLF CyberHub, Amphitheatre, Gurugram',
    notes: 'Autumn campaign transition reels.',
    amountInr: 1500,
    status: 'COMPLETED',
    paymentStatus: 'RELEASED',
    startOtp: '629401',
    deliverablesSummary: '3 Edited 4K Reels + 20 Stills',
    deliveredPhotosCount: 20,
    canCancel: false,
    hasReview: true,
    createdAt: '2026-09-25',
  },
  {
    id: 'SNP-2026-97910',
    photographerId: 'pro-aman',
    photographerName: 'Aman Verma',
    photographerAvatar: '/reference-assets/avatar_aman.jpg',
    photographerRating: 4.9,
    photographerPhone: '+91 98101 23456',
    category: 'Events',
    packageTitle: 'Rooftop Anniversary & Birthday Coverage',
    date: '12 Sep 2026',
    timeSlot: '07:00 PM - 10:00 PM',
    duration: '3 Hours',
    venueAddress: 'Olive Bar & Kitchen, One Style Mile, Mehrauli',
    notes: 'Candid guest portraits and cake-cutting.',
    amountInr: 6000,
    status: 'COMPLETED',
    paymentStatus: 'RELEASED',
    startOtp: '394812',
    deliverablesSummary: '45 Edited High-Res Photos',
    deliveredPhotosCount: 45,
    canCancel: false,
    hasReview: true,
    createdAt: '2026-09-08',
  },
  {
    id: 'SNP-2026-97805',
    photographerId: 'pro-karan',
    photographerName: 'Karan Mehta',
    photographerAvatar: '/reference-assets/avatar_karan.jpg',
    photographerRating: 4.9,
    photographerPhone: '+91 99100 88219',
    category: 'Portrait Session',
    packageTitle: 'Executive Headshots Studio Pack',
    date: '20 Aug 2026',
    timeSlot: '02:00 PM - 03:30 PM',
    duration: '1.5 Hours',
    venueAddress: 'Connaught Place, Inner Circle, New Delhi',
    amountInr: 3500,
    status: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    startOtp: '849102',
    deliverablesSummary: '15 High-Res Retouched Headshots',
    canCancel: false,
    hasReview: false,
    createdAt: '2026-08-15',
  },
];

export const INITIAL_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'gal-1',
    bookingId: 'SNP-2026-98042',
    photographerName: 'Karan Mehta',
    category: 'Creator Reels',
    url: '/reference-assets/karan_c1.jpg',
    title: 'CyberHub Dynamic Gimbal Tracking',
    aspectRatio: 'aspect-[4/3]',
    sizeMb: 8.4,
    deliveredAt: '29 Sep 2026',
  },
  {
    id: 'gal-2',
    bookingId: 'SNP-2026-98042',
    photographerName: 'Karan Mehta',
    category: 'Creator Reels',
    url: '/reference-assets/karan_c2.jpg',
    title: 'Golden Sunset Silhouette by CyberHub Bridge',
    aspectRatio: 'aspect-[16/10]',
    sizeMb: 12.1,
    deliveredAt: '29 Sep 2026',
  },
  {
    id: 'gal-3',
    bookingId: 'SNP-2026-97910',
    photographerName: 'Aman Verma',
    category: 'Events',
    url: '/reference-assets/cat_events.jpg',
    title: 'Mehrauli Floral Table Ambiance & Warm Bokeh',
    aspectRatio: 'aspect-[4/3]',
    sizeMb: 9.8,
    deliveredAt: '14 Sep 2026',
  },
  {
    id: 'gal-4',
    bookingId: 'SNP-2026-97910',
    photographerName: 'Aman Verma',
    category: 'Events',
    url: '/reference-assets/cat_portrait.jpg',
    title: 'Candid Guest Portrait in Warm Light',
    aspectRatio: 'aspect-[4/3]',
    sizeMb: 14.2,
    deliveredAt: '14 Sep 2026',
  },
  {
    id: 'gal-5',
    bookingId: 'SNP-2026-98042',
    photographerName: 'Karan Mehta',
    category: 'Creator Reels',
    url: '/reference-assets/cat_reels.jpg',
    title: 'Urban Street Style Lookbook Master Frame',
    aspectRatio: 'aspect-[16/10]',
    sizeMb: 11.5,
    deliveredAt: '29 Sep 2026',
  },
  {
    id: 'gal-6',
    bookingId: 'SNP-2026-97910',
    photographerName: 'Aman Verma',
    category: 'Events',
    url: '/reference-assets/aman_c2.jpg',
    title: 'Natural Smile Outdoor Still',
    aspectRatio: 'aspect-[3/4]',
    sizeMb: 7.9,
    deliveredAt: '14 Sep 2026',
  },
];

export const INITIAL_CUSTOMER_PAYMENTS: CustomerPaymentRecord[] = [
  {
    id: 'pay-1',
    bookingRef: 'SNP-2026-98124',
    serviceTitle: 'Signature Editorial Portrait (Lodhi Art District)',
    photographerName: 'Aman Verma',
    amountInr: 7500,
    paymentDate: '09 Oct 2026',
    paymentMethod: 'UPI - Google Pay (aarav@okaxis)',
    status: 'ESCROW_HELD',
    invoiceRef: 'INV-2026-098124',
  },
  {
    id: 'pay-2',
    bookingRef: 'SNP-2026-98119',
    serviceTitle: 'Pre-Wedding Golden Hour Session (Sunder Nursery)',
    photographerName: 'Riya Sharma',
    amountInr: 2800,
    paymentDate: '08 Oct 2026',
    paymentMethod: 'HDFC Credit Card (•••• 4182)',
    status: 'ESCROW_HELD',
    invoiceRef: 'INV-2026-098119',
  },
  {
    id: 'pay-3',
    bookingRef: 'SNP-2026-98042',
    serviceTitle: '4K Vertical Video Creator Suite (CyberHub)',
    photographerName: 'Karan Mehta',
    amountInr: 1500,
    paymentDate: '28 Sep 2026',
    paymentMethod: 'UPI - Paytm (9871044219@paytm)',
    status: 'SETTLED',
    invoiceRef: 'INV-2026-098042',
  },
  {
    id: 'pay-4',
    bookingRef: 'SNP-2026-97910',
    serviceTitle: 'Rooftop Anniversary & Birthday (Mehrauli)',
    photographerName: 'Aman Verma',
    amountInr: 6000,
    paymentDate: '12 Sep 2026',
    paymentMethod: 'ICICI NetBanking',
    status: 'SETTLED',
    invoiceRef: 'INV-2026-097910',
  },
  {
    id: 'pay-5',
    bookingRef: 'SNP-2026-97805',
    serviceTitle: 'Executive Headshots Studio Pack (CP)',
    photographerName: 'Karan Mehta',
    amountInr: 3500,
    paymentDate: '15 Aug 2026',
    paymentMethod: 'UPI - Google Pay (Refunded 18 Aug)',
    status: 'REFUNDED',
    invoiceRef: 'REF-2026-097805',
  },
];

export const INITIAL_CUSTOMER_REVIEWS: CustomerReviewRecord[] = [
  {
    id: 'rev-c1',
    bookingRef: 'SNP-2026-98042',
    photographerId: 'pro-karan',
    photographerName: 'Karan Mehta',
    photographerAvatar: '/reference-assets/avatar_karan.jpg',
    category: 'Creator Reels',
    rating: 5,
    date: '30 Sep 2026',
    comment: 'Karan was super energetic and knew all the best architectural corners in CyberHub. The 4K vertical reels looked ready for an editorial ad campaign! Delivered the link right on time.',
    photographerReply: 'Thank you Aarav! You brought great energy to the session. Loved working on those video transitions.',
  },
  {
    id: 'rev-c2',
    bookingRef: 'SNP-2026-97910',
    photographerId: 'pro-aman',
    photographerName: 'Aman Verma',
    photographerAvatar: '/reference-assets/avatar_aman.jpg',
    category: 'Events',
    rating: 5,
    date: '15 Sep 2026',
    comment: 'Aman blended in seamlessly with our dinner guests and captured genuine expressions and laughter without interrupting anyone. The lighting in the garden courtyard was gorgeous.',
    photographerReply: 'It was an absolute pleasure documenting your milestone celebration, Aarav!',
  },
];

export const INITIAL_NOTIFICATIONS: CustomerNotificationItem[] = [
  {
    id: 'notif-c1',
    title: 'Photographer Arrived at Venue',
    message: 'Aman Verma has arrived at Lodhi Art District. Please share your 6-digit Shoot-Start OTP (482910) to begin the session.',
    time: '5 mins ago',
    unread: true,
    type: 'transit',
    actionHref: '/customer/bookings/SNP-2026-98124',
  },
  {
    id: 'notif-c2',
    title: 'Gallery Available for Download',
    message: 'Karan Mehta uploaded 20 high-res photos and 3 4K reels for your CyberHub shoot. Access your private proofing gallery now.',
    time: '28 Sep 2026',
    unread: false,
    type: 'delivery',
    actionHref: '/customer/gallery',
  },
  {
    id: 'notif-c3',
    title: 'Payment Secured in Escrow',
    message: '₹2,800 for your Sunder Nursery shoot is locked safely in escrow. Funds will only release after photo delivery.',
    time: '08 Oct 2026',
    unread: false,
    type: 'payment',
    actionHref: '/customer/payments',
  },
];
