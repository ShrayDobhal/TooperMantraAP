import { NextResponse } from 'next/server';

const STORAGE_ZONE = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || 'topper-mantra-storage';
const STORAGE_KEY = process.env.NEXT_PUBLIC_BUNNY_STORAGE_KEY || 'c3d0a28a-7069-4ac2-90ddc5683a27-5ff6-454c';
const CDN_PULL_URL = (process.env.NEXT_PUBLIC_BUNNY_CDN_URL || 'https://TopperMantra.b-cdn.net').replace(/\/$/, '');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${folder}/${timestamp}_${randomSuffix}_${safeName}`;

    const hosts = ['storage.bunnycdn.com', 'uk.storage.bunnycdn.com', 'ny.storage.bunnycdn.com'];
    let lastError = '';

    for (const host of hosts) {
      try {
        const uploadUrl = `https://${host}/${STORAGE_ZONE}/${filename}`;
        const bunnyRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': STORAGE_KEY,
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: buffer,
        });

        if (bunnyRes.ok) {
          const publicUrl = `${CDN_PULL_URL}/${filename}`;
          return NextResponse.json({
            success: true,
            data: {
              url: publicUrl,
              filename,
            },
          });
        }
        lastError = `Host ${host} returned status ${bunnyRes.status}`;
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return NextResponse.json(
      { success: false, error: `Failed to upload file to Bunny Storage: ${lastError}` },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Server error during upload: ${err.message}` },
      { status: 500 }
    );
  }
}
