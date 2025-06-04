'use node';

import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { Buffer, Blob } from 'node:buffer';
import type { Id } from '../_generated/dataModel';

export const ipfsUpload = internalAction({
  args: {
    imageUrl: v.string(),
  },
  handler: async (
    ctx,
    { imageUrl },
  ): Promise<{ cid: string; ipfsUrl: string; uploadId: Id<'ipfsUploads'> }> => {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const blob = new Blob([buffer]);

      const { PinataSDK } = await import('pinata');
      const pinata = new PinataSDK({
        pinataJwt: process.env.PINATA_JWT as string,
        pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL as string,
      });
      const uploadResult = await pinata.upload.public.file(
        blob as unknown as File,
      );
      const ipfsUrl = await pinata.gateways.public.convert(uploadResult.cid);

      const uploadId: Id<'ipfsUploads'> = await ctx.runMutation(
        internal.functions.images.saveIpfsUpload,
        {
          originalUrl: imageUrl,
          cid: uploadResult.cid,
          ipfsUrl,
          createdAt: Date.now(),
        },
      );

      return { cid: uploadResult.cid, ipfsUrl, uploadId };
    } catch (error: any) {
      console.error('IPFS upload failed:', error);
      throw error;
    }
  },
});
