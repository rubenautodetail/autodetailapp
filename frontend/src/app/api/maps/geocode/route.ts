import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 3) {
    return NextResponse.json({ features: [] });
  }

  const token = process.env.MAPBOX_SECRET_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Mapbox token not configured" }, { status: 500 });
  }

  const encoded = encodeURIComponent(q);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=us&types=address&autocomplete=true&limit=5`;

  const res = await fetch(url);
  const data = await res.json();

  return NextResponse.json(data);
}
