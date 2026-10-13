import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');
    const userId = searchParams.get('userId');

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    let targetCreatorId = creatorId;

    if (!targetCreatorId && userId) {
      const { data: creator } = await client
        .from('creator_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      targetCreatorId = creator?.id;
    }

    if (!targetCreatorId) {
      return NextResponse.json({ success: true, items: [] });
    }

    const { data: items, error } = await client
      .from('creator_portfolio_items')
      .select('*')
      .eq('creator_id', targetCreatorId)
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, items: items || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorId, userId, title, description, previewUrl, mediaType = 'photo' } = body;

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    let targetCreatorId = creatorId;
    if (!targetCreatorId && userId) {
      const { data: creator } = await client
        .from('creator_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      targetCreatorId = creator?.id;
    }

    if (!targetCreatorId) {
      return NextResponse.json({ success: false, error: 'Creator ID not found' }, { status: 400 });
    }

    const { data, error } = await client
      .from('creator_portfolio_items')
      .insert({
        creator_id: targetCreatorId,
        title: title || 'Untitled Portfolio Photo',
        description: description || 'Portfolio Showcase',
        preview_url: previewUrl,
        media_type: mediaType,
        is_published: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Portfolio item ID is required' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    const { error } = await client
      .from('creator_portfolio_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
