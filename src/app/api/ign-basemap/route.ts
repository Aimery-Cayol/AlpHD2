import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const layer = searchParams.get('layer') || 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2';
  const width = searchParams.get('width') || '2048';
  const height = searchParams.get('height') || '2048';

  if (!bbox) {
    return NextResponse.json({ error: 'Missing bbox parameter' }, { status: 400 });
  }

  const ignUrl = `https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer}&STYLES=&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=${width}&HEIGHT=${height}&FORMAT=image/png`;


  try {
    const response = await fetch(ignUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'IGN API error' }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      },
    });
  } catch (error) {
    console.error('Failed to fetch IGN basemap:', error);
    return NextResponse.json({ error: 'Failed to fetch IGN basemap' }, { status: 500 });
  }
}
