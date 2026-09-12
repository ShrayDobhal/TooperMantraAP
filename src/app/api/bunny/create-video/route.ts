import { NextResponse } from 'next/server';

const STREAM_LIB_ID = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIB_ID || '735098';
const STREAM_API_KEY = process.env.NEXT_PUBLIC_BUNNY_STREAM_API_KEY || '54cc8cdb-fb65-4fe4-8ed4081b4588-650d-4a81';
const STREAM_CDN_HOST = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_HOST || 'vz-2e46c256-4ab.b-cdn.net';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body.title || 'Untitled Video').trim();

    const bunnyRes = await fetch(`https://video.bunnycdn.com/library/${STREAM_LIB_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': STREAM_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!bunnyRes.ok) {
      const errText = await bunnyRes.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          error: `Bunny Stream error (${bunnyRes.status}): ${errText || bunnyRes.statusText}`,
        },
        { status: bunnyRes.status }
      );
    }

    const bunnyData = await bunnyRes.json();
    const guid = bunnyData.guid || bunnyData.id;

    if (!guid) {
      return NextResponse.json(
        { success: false, error: 'Bunny Stream did not return a valid video GUID.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bunnyVideoId: guid,
        libraryId: STREAM_LIB_ID,
        uploadUrl: `https://video.bunnycdn.com/library/${STREAM_LIB_ID}/videos/${guid}`,
        authorizationHeader: STREAM_API_KEY,
        cdnUrl: `https://${STREAM_CDN_HOST}/${guid}/playlist.m3u8`,
        embedUrl: `https://iframe.mediadelivery.net/embed/${STREAM_LIB_ID}/${guid}?autoplay=false&preload=true`,
        thumbnailUrl: `https://${STREAM_CDN_HOST}/${guid}/thumbnail.jpg`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Server error initializing Bunny video: ${err.message}` },
      { status: 500 }
    );
  }
}
