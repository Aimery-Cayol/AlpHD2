import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'tiles/tiles.geojson';

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-3',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path
    });

    const response = await s3Client.send(command);
    if (!response.Body) return new NextResponse("Non trouvé", { status: 404 });

    const data = await response.Body.transformToByteArray();
    const contentType = path.endsWith('.geojson') ? 'application/json' : 'application/octet-stream';

    return new NextResponse(data, {
      headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}