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
      return NextResponse.json({ success: true, services: [] });
    }

    const { data: services, error } = await client
      .from('creator_services')
      .select('*, service_categories(name)')
      .eq('creator_id', targetCreatorId)
      .order('base_price', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, services: services || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      creatorId,
      userId,
      title,
      description,
      basePrice,
      durationMinutes,
      deliveryTimeHours,
      isActive = true,
    } = body;

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

    const payload = {
      creator_id: targetCreatorId,
      title: title || 'Photography Package',
      description: description || 'High-res retouched photographs and private client gallery.',
      base_price: Number(basePrice) || 3999,
      duration_minutes: Number(durationMinutes) || 120,
      delivery_time_hours: Number(deliveryTimeHours) || 48,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      // Update existing service
      const { data, error } = await client
        .from('creator_services')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new service
      const { data, error } = await client
        .from('creator_services')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, service: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    const { error } = await client
      .from('creator_services')
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
