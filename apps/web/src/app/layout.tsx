import type { Metadata } from 'next';
import './globals.css';
import { AiChatWidgetRoot } from '../components/ai/AiChatWidgetRoot';
import { AuthModalProvider } from '../components/auth/AuthModalContext';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-canvas-primary text-ink-primary selection:bg-brand-subtle selection:text-brand">
        <AuthModalProvider>
          {children}
          <AiChatWidgetRoot />
        </AuthModalProvider>
      </body>
    </html>
  );
}
