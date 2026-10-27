import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Caveat, Inter } from 'next/font/google';
import './globals.css';
import { AuthModalProvider } from '../components/auth/AuthModalContext';
import { UserProfileProvider } from '../context/UserProfileContext';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-caveat',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'REEPY — On-Demand Photography & Content Creator Marketplace',
  description: 'Book verified professional photographers and content creators near you for reels, portraits, weddings, and commercial shoots.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${caveat.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F5F7F9] text-[#191C22] selection:bg-[#EFFCF8] selection:text-[#0F766E] font-sans">
        <AuthModalProvider>
          <UserProfileProvider>
            {children}
          </UserProfileProvider>
        </AuthModalProvider>
      </body>
    </html>
  );
}
