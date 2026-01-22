import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'eu-west-3';

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || 'tiles/tiles.geojson'
    
    if (!bucketName || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ 
        error: "Configuration S3 incomplète",
        details: "Vérifiez votre fichier .env.local"
      }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    })

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      return new NextResponse("Fichier non trouvé sur S3", { status: 404 })
    }

    // --- CORRECTION ICI : Méthode de lecture compatible ---
    const streamToBuffer = async (stream: any): Promise<Uint8Array> => {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    };

    const data = await streamToBuffer(response.Body);
    // ----------------------------------------------------
    
    const contentType = path.endsWith('.geojson') ? 'application/json' : 'application/octet-stream'

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store' 
      }
    })

  } catch (error: any) {
    console.error('Erreur S3 détaillée:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}