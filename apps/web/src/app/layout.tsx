import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Caveat, Inter } from 'next/font/google';
import './globals.css';
import { AiChatWidgetRoot } from '../components/ai/AiChatWidgetRoot';
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
  title: 'SnapShoot — On-Demand Photography & Videography Marketplace',
  description: 'Book verified professional photographers and videographers near you for events, portraits, weddings, and commercial shoots.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${caveat.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-canvas-primary text-ink-primary selection:bg-brand-subtle selection:text-brand font-sans">
        <AuthModalProvider>
          <UserProfileProvider>
            {children}
            <AiChatWidgetRoot />
          </UserProfileProvider>
        </AuthModalProvider>
      </body>
    </html>
  );
}
