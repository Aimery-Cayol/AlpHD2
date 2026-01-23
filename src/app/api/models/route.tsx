import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-3',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'models/', 
    });

    const response = await s3Client.send(command);

    const models = response.Contents?.map(item => ({
      name: item.Key?.split('/').pop() || '',
      url: item.Key,
      size: item.Size
    })).filter(m => m.name.endsWith('.drc') || m.name.endsWith('.ply')) || [];

    return NextResponse.json(models);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}