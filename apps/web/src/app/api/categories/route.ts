import { NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
    }

    const { data, error } = await client
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map categories with rich imagery
    const categoryImages: Record<string, string> = {
      'wedding-photography': '/reference-assets/cat_events.jpg',
      'pre-wedding-shoots': '/reference-assets/aman_c1.jpg',
      'event-photography': '/reference-assets/cat_events.jpg',
      'product-photography': '/reference-assets/hero_scene.jpg',
      'videography-reels': '/reference-assets/cat_reels.jpg',
      'cinematography': '/reference-assets/riya_c1.jpg',
      'corporate-photography': '/reference-assets/cat_portrait.jpg',
    };

    const categories = (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: categoryImages[cat.slug] || '/reference-assets/cat_portrait.jpg',
      href: `/explore?category=${encodeURIComponent(cat.name)}`,
    }));

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
