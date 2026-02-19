import { NextRequest, NextResponse } from 'next/server';

const IGN_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchIGN(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, IGN_TIMEOUT_MS);
      if (response.ok) return response;
      lastError = new Error(`IGN HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

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
    const response = await fetchIGN(ignUrl);
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    // En cas d'echec apres retries, tenter avec resolution reduite
    try {
      const fallbackUrl = `https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer}&STYLES=&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=1024&HEIGHT=1024&FORMAT=image/png`;
      const fallbackResponse = await fetchWithTimeout(fallbackUrl, IGN_TIMEOUT_MS);
      if (fallbackResponse.ok) {
        const buffer = await fallbackResponse.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch {
      // Fallback a aussi echoue
    }

    console.error('Failed to fetch IGN basemap after retries:', error);
    return NextResponse.json({ error: 'Failed to fetch IGN basemap' }, { status: 500 });
  }
}
