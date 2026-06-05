import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const { filename, contentType } = await req.json();

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 });
  }
  if (!['image/jpeg', 'image/png'].includes(contentType)) {
    return NextResponse.json({ error: 'Only JPG/PNG allowed' }, { status: 400 });
  }

  const ext = filename.split('.').pop();
  const objectKey = `receipts/${userId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return NextResponse.json({ uploadUrl, objectKey });
}
