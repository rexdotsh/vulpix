'use node';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// flash model can go down to 600-700px but we want 1024x1024px
export const getPrompt = (prompt: string) => {
  const systemPrompt = `<task>
Generate a vibrant cartoon-style NFT character image
</task>

<requirements>
  <dimensions>1024x1024 pixels</dimensions>
  <art_style>Vibrant cartoon art, clean digital illustration, bold colors</art_style>
  <format>NFT character portrait</format>
</requirements>

<character_specifications>
  <background>
    <instruction>Choose one solid color background</instruction>
    <options>bright blue, purple, orange, pink, green, yellow, red, cyan, magenta, lime</options>
  </background>
  
  <clothing>
    <instruction>Select one clothing type with unique color combinations</instruction>
    <options>
      <option>Simple t-shirt with graphic or solid color</option>
      <option>Stylish jacket or hoodie</option>
      <option>Futuristic armor or tech wear</option>
    </options>
  </clothing>
  
  <accessories>
    <instruction>Add one accessory based on rarity level</instruction>
    <common>Baseball cap, beanie, simple hat</common>
    <uncommon>Round glasses, rectangular glasses, sunglasses</uncommon>
    <rare>Gold necklace, silver chain, jewelry</rare>
  </accessories>
  
  <expression>
    <instruction>Choose one facial expression</instruction>
    <options>happy smile, determined look, curious expression</options>
  </expression>
</character_specifications>

<style_guidelines>
  <colors>Use bright, saturated colors that pop</colors>
  <lines>Clean, bold outlines</lines>
  <shading>Simple but effective shading</shading>
  <overall>Make it collectible and appealing like popular NFT collections</overall>
</style_guidelines>

<user_prompt>
${prompt}
</user_prompt>`;
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
