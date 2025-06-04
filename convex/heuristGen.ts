'use node';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

export const callHeuristAPI = internalAction({
  args: {
    imageGenId: v.id('imageGenerations'),
    model: v.string(),
    prompt: v.string(),
    negPrompt: v.optional(v.string()),
    numIterations: v.optional(v.number()),
    guidanceScale: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    seed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const { default: Heurist } = await import('heurist');
      const heurist = new Heurist({ apiKey: process.env.HEURIST_API_KEY });

      const result = await heurist.images.generate({
        model: args.model,
        prompt: args.prompt,
        ...(args.negPrompt && { neg_prompt: args.negPrompt }),
        ...(args.numIterations && { num_iterations: args.numIterations }),
        ...(args.guidanceScale && { guidance_scale: args.guidanceScale }),
        ...(args.width && { width: args.width }),
        ...(args.height && { height: args.height }),
        ...(args.seed !== undefined && { seed: args.seed }),
      });

      await ctx.runMutation(internal.functions.images.saveGeneratedImage, {
        imageGenId: args.imageGenId,
        imageUrl: result.url,
      });

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      await ctx.runMutation(internal.functions.images.markImageAsFailed, {
        imageGenId: args.imageGenId,
        error: errorMessage,
      });

      throw error;
    }
  },
});
