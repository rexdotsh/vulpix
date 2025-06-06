'use node';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

export const callGoogleAPI = internalAction({
  args: {
    imageGenId: v.id('imageGenerations'),
    model: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { google } = await import('@ai-sdk/google');
      const { generateText } = await import('ai');
      const { put } = await import('@vercel/blob');

      const result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        providerOptions: {
          google: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        },
        prompt: args.prompt,
      });

      // extract the first image file from the response
      const imageFile = result.files?.find((file) =>
        file.mimeType?.startsWith('image/'),
      );

      if (!imageFile) {
        throw new Error('No image was generated in the response');
      }

      const imageBuffer = Buffer.from(imageFile.base64, 'base64');

      const timestamp = Date.now();
      const extension = imageFile.mimeType?.split('/')[1] || 'png';
      const filename = `generated-images/${timestamp}-${args.imageGenId}.${extension}`;

      const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType: imageFile.mimeType,
      });

      await ctx.runMutation(internal.images.saveGeneratedImage, {
        imageGenId: args.imageGenId,
        imageUrl: blob.url,
      });

      return { url: blob.url };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      await ctx.runMutation(internal.images.markImageAsFailed, {
        imageGenId: args.imageGenId,
        error: errorMessage,
      });

      throw error;
    }
  },
});
