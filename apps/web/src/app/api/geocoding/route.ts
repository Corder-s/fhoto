import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    const mapboxToken =
      process.env.MAPBOX_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      '';

    // 1. Reverse Geocoding (lat, lng -> address)
    if (lat && lng) {
      if (mapboxToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const first = data.features?.[0];
          return NextResponse.json({
            success: true,
            address: first?.place_name || `Location (${lat}, ${lng})`,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          });
        }
      }

      // Nominatim Reverse Fallback
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'SnapShoot-App' } });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        return NextResponse.json({
          success: true,
          address: nomData.display_name || `Location (${lat}, ${lng})`,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        });
      }
    }

    // 2. Forward Geocoding & Address Autocomplete Suggestions (query -> list of places)
    if (!query) {
      return NextResponse.json({ success: true, results: [] });
    }

    if (mapboxToken) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?country=IN&types=poi,address,neighborhood,locality&limit=5&access_token=${mapboxToken}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = (data.features || []).map((feat: any) => ({
          id: feat.id,
          address: feat.place_name,
          text: feat.text,
          latitude: feat.center?.[1],
          longitude: feat.center?.[0],
          city: feat.context?.find((c: any) => c.id.startsWith('place'))?.text || 'Delhi NCR',
        }));

        return NextResponse.json({
          success: true,
          results,
        });
      }
    }

    // OpenStreetMap Fallback
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=in&limit=5`;
    const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'SnapShoot-App' } });
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const results = (nomData || []).map((item: any) => ({
        id: `osm-${item.place_id}`,
        address: item.display_name,
        text: item.name || query,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: 'India',
      }));

      return NextResponse.json({
        success: true,
        results,
      });
    }

    return NextResponse.json({ success: true, results: [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Geocoding service unavailable' },
      { status: 500 }
    );
  }
}
