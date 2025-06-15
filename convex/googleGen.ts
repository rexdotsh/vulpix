'use node';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// flash model can go down to 600-700px but we want 1024x1024px
export const getPrompt = (prompt: string) => {
  const systemPrompt = `System prompt: Generate vibrant, cartoonish NFTs with the following description:
                 Each piece must have a unique background color chosen from a palette of 12 distinct shades.
                 Clothing styles should include either a simple t-shirt, a stylish jacket, or futuristic armor, each with unique color combinations. 
                 Accessories should vary in rarity: common (baseball caps or beanies), uncommon (round or rectangular glasses), and rare (gold or silver necklaces). 
                 Facial expressions should be one of the following: happy, determined, or curious. 
                 Ensure each NFT has a distinct combination of these features to maximize uniqueness and collectibility.
                 Note: Strictly stick to the user prompt. The generated NFT should be of 1024x1024px.
                 User prompt: ${prompt}`;
  return systemPrompt;
};

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
        prompt: getPrompt(args.prompt),
      });

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
