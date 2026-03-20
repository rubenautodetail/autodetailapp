import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const zipCode = searchParams.get("zip");

    if (!q || q.length < 3) {
      return NextResponse.json({ features: [] });
    }

    const token = process.env.MAPBOX_SECRET_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Mapbox token not configured" }, { status: 500 });
    }

    const searchQuery = zipCode ? `${q}, ${zipCode}` : q;
    const encoded = encodeURIComponent(searchQuery);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=us&types=address&autocomplete=true&limit=10`;

    const res = await fetch(url);
    const data = await res.json();

    let features = data.features ?? [];

    if (zipCode) {
      features = features.filter((feature: any) => {
        const ctx = feature.context ?? [];
        const zipEntry = ctx.find((c: any) => c.id.startsWith("postcode"));
        return zipEntry && zipEntry.text === zipCode;
      });
    }

    data.features = features.slice(0, 5);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocode API error:", error);
    return NextResponse.json({ features: [] }, { status: 500 });
  }
}
