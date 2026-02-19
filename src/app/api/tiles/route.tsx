import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

// Singleton S3 Client : réutilise la connexion TLS et le pool HTTP entre les requêtes
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-3',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'tiles/tiles.geojson';

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path
    });

    const response = await s3Client.send(command);
    if (!response.Body) return new NextResponse("Non trouvé", { status: 404 });

    const contentType = path.endsWith('.geojson') ? 'application/json' : 'application/octet-stream';

    // Cache agressif pour les fichiers mesh (immuables), pas pour les GeoJSON
    const cacheControl = path.endsWith('.geojson')
      ? 'public, max-age=3600'
      : 'public, max-age=604800, immutable';

    // Streaming : envoyer les données au client au fur et à mesure sans tout bufferiser
    const nodeStream = response.Body as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': response.ContentLength?.toString() || '',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': cacheControl,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
