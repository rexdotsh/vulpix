import { NextResponse } from 'next/server';
import { Buffer, Blob } from 'node:buffer';
import { pinata } from '@/lib/pinata';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required.' },
        { status: 400 },
      );
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const blob = new Blob([buffer]);

    const uploadResult = await pinata.upload.public.file(
      blob as unknown as File,
    );
    const ipfsUrl = await pinata.gateways.public.convert(uploadResult.cid);

    return NextResponse.json({ url: ipfsUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading image to IPFS via Pinata:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
