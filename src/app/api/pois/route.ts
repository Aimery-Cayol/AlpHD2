import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-3',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || '';
const KEY = 'pois/pois.json';

export async function GET() {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: KEY });
    const response = await s3Client.send(command);

    // SDK v3 : transformToString() est la méthode officielle pour lire le body
    const json = await (response.Body as any).transformToString();

    return NextResponse.json(JSON.parse(json), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    // Fichier inexistant → liste vide (première utilisation)
    if (error?.name === 'NoSuchKey' || error?.Code === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }
    console.error('Erreur GET pois:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pois = await request.json();

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: JSON.stringify(pois),
      ContentType: 'application/json',
    });
    await s3Client.send(command);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Erreur POST pois:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
