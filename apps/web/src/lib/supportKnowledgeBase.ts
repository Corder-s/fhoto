export interface FaqArticle {
  id: string;
  category: 'bookings' | 'payments' | 'otp_arrival' | 'cancellations' | 'deliverables' | 'creator_studio' | 'account';
  audience: 'all' | 'customer' | 'creator';
  question: string;
  answer: string;
  relatedLink?: {
    label: string;
    href: string;
  };
}

export interface HelpCategory {
  id: string;
  key: string;
  label: string;
  description: string;
  iconName: string;
  audience: 'all' | 'customer' | 'creator';
}

export const SUPPORT_CATEGORIES: HelpCategory[] = [
  {
    id: 'cat_bookings',
    key: 'bookings_reservations',
    label: 'Bookings & Reservations',
    description: 'Booking requests, package selection, shoot dates, and venue location.',
    iconName: 'Calendar',
    audience: 'all',
  },
  {
    id: 'cat_otp',
    key: 'otp_arrival',
    label: 'Shoot OTP & Arrival',
    description: '6-digit Shoot-Start arrival handshake verification and check-in procedures.',
    iconName: 'KeyRound',
    audience: 'all',
  },
  {
    id: 'cat_payments',
    key: 'payments_refunds',
    label: 'Payments & Escrow',
    description: '100% Escrow security, Razorpay transactions, partial vs full payment, and invoices.',
    iconName: 'CreditCard',
    audience: 'all',
  },
  {
    id: 'cat_cancellations',
    key: 'cancellations_rescheduling',
    label: 'Cancellations & Refunds',
    description: '24-hour full refund policy, rescheduling requests, and creator compensation rules.',
    iconName: 'RefreshCw',
    audience: 'all',
  },
  {
    id: 'cat_deliverables',
    key: 'deliverables',
    label: 'Photos & Delivery',
    description: '24–48h digital gallery delivery, high-resolution downloads, and review submissions.',
    iconName: 'Image',
    audience: 'customer',
  },
  {
    id: 'cat_creator_studio',
    key: 'portfolio_uploads',
    label: 'Studio & Portfolio',
    description: 'Profile verification, portfolio uploads, custom packages, and calendar hours.',
    iconName: 'Camera',
    audience: 'creator',
  },
  {
    id: 'cat_payouts',
    key: 'payouts_earnings',
    label: 'Earnings & Payouts',
    description: 'Escrow release timelines, bank payouts, earnings statements, and platform fees.',
    iconName: 'DollarSign',
    audience: 'creator',
  },
  {
    id: 'cat_account',
    key: 'account_profile',
    label: 'Account & Security',
    description: 'Profile settings, phone verification, notifications, and security.',
    iconName: 'ShieldCheck',
    audience: 'all',
  },
];

export const FAQ_ARTICLES: FaqArticle[] = [
  // Bookings & Reservations
  {
    id: 'faq_booking_how',
    category: 'bookings',
    audience: 'customer',
    question: 'How do I book a photographer on REEPY?',
    answer: 'Browse verified photographers by category (Reels, Weddings, Portraits, Fashion) or search by city. Select your desired package, choose an event date, start time, duration, and venue location. Review your itemized quote (including zero hidden travel fees within city limits) and confirm your reservation with full or partial escrow payment.',
    relatedLink: { label: 'Explore Photographers', href: '/explore' },
  },
  {
    id: 'faq_booking_acceptance',
    category: 'bookings',
    audience: 'all',
    question: 'How long does a photographer have to accept a booking request?',
    answer: 'Photographers receive an instant notification upon booking and are requested to accept within 12 hours. If a photographer is unable to accept your shoot date, your escrow payment is immediately unlocked with zero penalty.',
    relatedLink: { label: 'View Bookings', href: '/customer/bookings' },
  },
  // Shoot-Start OTP & Arrival
  {
    id: 'faq_otp_explanation',
    category: 'otp_arrival',
    audience: 'all',
    question: 'What is the Shoot-Start OTP and how does it protect me?',
    answer: 'The Shoot-Start OTP is a secure 6-digit code generated for every confirmed booking. The customer shares this OTP verbally ONLY when the photographer physically arrives at the shoot venue. The photographer enters the OTP into their Creator Studio to transition the booking to "In Progress". Never share the OTP over phone, chat, or in advance.',
    relatedLink: { label: 'Client Dashboard', href: '/customer/dashboard' },
  },
  {
    id: 'faq_otp_creator_entry',
    category: 'otp_arrival',
    audience: 'creator',
    question: 'How do I verify the customer OTP as a photographer?',
    answer: 'Upon reaching the shoot location, greet the customer and request the 6-digit Shoot-Start OTP displayed on their Client Dashboard. Open your Booking Requests (/photographer/bookings), tap "Verify Arrival OTP", enter the code, and your shoot will immediately update to active in-progress status.',
    relatedLink: { label: 'Creator Bookings', href: '/photographer/bookings' },
  },
  // Payments & Escrow
  {
    id: 'faq_escrow_security',
    category: 'payments',
    audience: 'all',
    question: 'How does REEPY 100% Escrow Protection work?',
    answer: 'When you book a shoot, your payment is held securely in escrow by the platform. Funds are NEVER released to the photographer upfront. They are released only after the shoot has been completed and verified, guaranteeing peace of mind for clients and secure payouts for creators.',
  },
  {
    id: 'faq_partial_payment',
    category: 'payments',
    audience: 'customer',
    question: 'Can I pay in installments or split payments?',
    answer: 'Yes! REEPY supports Half Payment (50% upfront to reserve your slot in escrow, with the remaining 50% due upon arrival verification) or Full Payment (100% upfront) during checkout.',
    relatedLink: { label: 'My Bookings', href: '/customer/bookings' },
  },
  // Cancellations & Rescheduling
  {
    id: 'faq_cancellation_policy',
    category: 'cancellations',
    audience: 'all',
    question: 'What is the REEPY cancellation and refund policy?',
    answer: '• More than 24 hours before shoot start: 100% full refund returned to your original payment method.\n• Within 24 hours of shoot start: 50% creator compensation fee applies to cover reserved calendar time, and the remainder is refunded.\n• In the rare event of photographer no-show: 100% immediate full refund is processed automatically.',
    relatedLink: { label: 'Cancellation Policy', href: '/cancellation' },
  },
  // Deliverables
  {
    id: 'faq_deliverables_turnaround',
    category: 'deliverables',
    audience: 'customer',
    question: 'When and how will I receive my edited photos?',
    answer: 'Digital photos and reels are uploaded directly to your private online gallery (/customer/gallery) within 24 to 48 hours for standard shoots (or up to 7 days for full-day weddings). You can preview high-resolution images and download raw or color-graded files directly to your device.',
    relatedLink: { label: 'Photo Gallery', href: '/customer/gallery' },
  },
  // Creator Studio Specific
  {
    id: 'faq_creator_verification',
    category: 'creator_studio',
    audience: 'creator',
    question: 'How do I get the Verified Creator badge on REEPY?',
    answer: 'Visit Profile Verification (/photographer/verification) in your Creator Studio. Submit your official ID (Aadhaar or PAN) along with a link to your verified Instagram or website portfolio. Our concierge operations team reviews applications within 24–48 hours.',
    relatedLink: { label: 'Profile Verification', href: '/photographer/verification' },
  },
  {
    id: 'faq_creator_portfolio_upload',
    category: 'creator_studio',
    audience: 'creator',
    question: 'How do I manage my portfolio photos and banner preview?',
    answer: 'Open Portfolio Gallery (/photographer/portfolio) in your Creator Studio. You can upload high-resolution images up to 50MB (JPG, PNG, WebP) using the "Upload Photo" button, update your profile cover banner using "Upload Banner", or import images using "Add by URL". All active photos appear immediately on your public profile.',
    relatedLink: { label: 'Portfolio Gallery', href: '/photographer/portfolio' },
  },
  {
    id: 'faq_creator_payouts',
    category: 'creator_studio',
    audience: 'creator',
    question: 'When and how are my earnings paid out?',
    answer: 'Earnings for completed shoots are released from platform escrow and credited to your Creator Payout Balance (/photographer/payouts) within 24 hours of customer confirmation. Payouts are transferred directly to your registered bank account or UPI ID.',
    relatedLink: { label: 'Payouts & Earnings', href: '/photographer/payouts' },
  },
  // Account & Support
  {
    id: 'faq_contact_support',
    category: 'account',
    audience: 'all',
    question: 'How can I speak to a live REEPY Support Specialist?',
    answer: 'You can submit a ticket right here in the Help Center! Our concierge operations desk operates 9:00 AM – 9:00 PM IST, Monday through Sunday. For urgent shoot emergencies, you can also reach us via phone at +91 98101 23456 or email support@reepy.in.',
  },
];
