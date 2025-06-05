import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  return process.env.VERCEL_ENV === 'production'
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:3000`;
}

export const decodeHexMetadata = (hexString: string) => {
  try {
    if (!hexString || hexString === '0x') return null;
    const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [],
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

export const getIpfsImageUrl = (metadata: any) => {
  if (!metadata?.image) return null;
  const { image } = metadata;
  if (image.startsWith('ipfs://')) {
    return `https://gateway.pinata.cloud/ipfs/${image.replace('ipfs://', '')}`;
  }
  if (typeof image === 'string' && image.length > 40) {
    return `https://gateway.pinata.cloud/ipfs/${image}`;
  }
  return image;
};
