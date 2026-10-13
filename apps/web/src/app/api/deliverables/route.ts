import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase/admin';

// Google Drive link validator regex
const GOOGLE_DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/(file\/d\/|drive\/folders\/|open\?id=|document\/d\/)[a-zA-Z0-9_-]+/;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    if (!admin) {
      // Offline fallback
      return NextResponse.json({
        success: true,
        deliverables: [],
        isOfflineMode: true,
      });
    }

    const { data: deliverables, error } = await admin
      .from('booking_deliverables')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process short-lived signed URLs for Supabase Storage objects
    const processed = await Promise.all(
      (deliverables || []).map(async (item) => {
        if (item.storage_provider === 'supabase_storage' && item.storage_path) {
          try {
            const { data: signedData } = await admin.storage
              .from('booking-deliverables')
              .createSignedUrl(item.storage_path, 3600); // 1 hour validity

            return {
              ...item,
              download_url: signedData?.signedUrl || null,
            };
          } catch {
            return item;
          }
        }
        return {
          ...item,
          download_url: item.external_url || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      deliverables: processed,
    });
  } catch (err: any) {
    console.error('Error fetching deliverables:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      bookingId,
      creatorId,
      customerId,
      title,
      description,
      deliverableType = 'edited_photos',
      storageProvider = 'supabase_storage',
      storagePath,
      externalUrl,
      fileName,
      mimeType,
      fileSizeBytes,
    } = body;

    if (!bookingId || !creatorId || !title) {
      return NextResponse.json(
        { error: 'Missing bookingId, creatorId, or title.' },
        { status: 400 }
      );
    }

    // Validate Google Drive link format
    if (storageProvider === 'google_drive') {
      if (!externalUrl || !GOOGLE_DRIVE_REGEX.test(externalUrl.trim())) {
        return NextResponse.json(
          {
            error:
              'Invalid Google Drive link format. Please provide a valid shareable file or folder link (e.g., https://drive.google.com/drive/folders/... or https://drive.google.com/file/d/...) and ensure viewer access permissions are enabled.',
          },
          { status: 400 }
        );
      }
    }

    const admin = getSupabaseAdminClient();

    let savedItem = {
      id: `deliv-${Date.now()}`,
      booking_id: bookingId,
      creator_id: creatorId,
      customer_id: customerId,
      title,
      description: description || null,
      deliverable_type: deliverableType,
      storage_provider: storageProvider,
      storage_path: storagePath || null,
      external_url: externalUrl || null,
      file_name: fileName || title,
      mime_type: mimeType || 'application/octet-stream',
      file_size_bytes: fileSizeBytes || 0,
      delivery_status: 'ready_for_review',
      created_at: new Date().toISOString(),
    };

    if (admin) {
      const { data, error } = await admin
        .from('booking_deliverables')
        .insert({
          booking_id: bookingId,
          creator_id: creatorId,
          customer_id: customerId,
          title,
          description,
          deliverable_type: deliverableType,
          storage_provider: storageProvider,
          storage_path: storagePath,
          external_url: externalUrl,
          file_name: fileName || title,
          mime_type: mimeType,
          file_size_bytes: fileSizeBytes,
          delivery_status: 'ready_for_review',
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      savedItem = data;
    }

    return NextResponse.json({
      success: true,
      deliverable: savedItem,
    });
  } catch (err: any) {
    console.error('Error saving deliverable:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
