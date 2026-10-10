import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ArrowRight, BookOpen } from 'lucide-react';

const STORIES = [
  {
    id: 'story-1',
    title: 'A Golden Hour Pre-Wedding Shoot in Old Delhi',
    author: 'Ananya Deshmukh',
    category: 'Couples',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    excerpt: 'How we captured spontaneous, candid romance amidst the timeless sandstone alleys of Chandni Chowk.',
  },
  {
    id: 'story-2',
    title: 'Editorial Studio Lighting for Startup Founders',
    author: 'Kabir Varma',
    category: 'Portraits',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Moving beyond boring corporate headshots: Using single-point Rembrandt lighting for confident branding.',
  },
  {
    id: 'story-3',
    title: 'Shooting 4K Vertical Cinema Reels on the Fly',
    author: 'Arjun Mehta',
    category: 'Reels & Video',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    excerpt: 'The camera settings, gimbal choreography, and pacing that turn an ordinary cafe visit into a viral Instagram reel.',
  },
];

export default function StoriesPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas-primary py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-brand">
              Visual Chronicles
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-primary">
              Stories & Creative Inspiration
            </h1>
            <p className="text-sm sm:text-base text-ink-secondary">
              Go behind the lens with verified creators across India sharing their lighting setups, client sessions, and techniques.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STORIES.map((s) => (
              <Card key={s.id} hoverEffect className="p-0 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-canvas-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="dark" size="sm">
                        {s.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <p className="text-xs font-semibold text-ink-muted">
                      By {s.author} • {s.readTime}
                    </p>
                    <h2 className="text-xl font-bold text-ink-primary leading-snug">
                      {s.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                      {s.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-contour-subtle mt-4">
                  <Link
                    href={`/photographers`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover transition-colors pt-3"
                  >
                    <span>Book Artists Like This</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
