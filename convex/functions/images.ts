import { v } from 'convex/values';
import {
  mutation,
  internalAction,
  internalMutation,
  query,
} from '../_generated/server';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

export const generateImage = mutation({
  args: {
    userAddress: v.string(),
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
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', args.userAddress))
      .first();

    const userId: Id<'users'> =
      existingUser?._id ??
      (await ctx.db.insert('users', { address: args.userAddress }));

    const imageGenId = await ctx.db.insert('imageGenerations', {
      userAddress: userId,
      prompt: args.prompt,
      negPrompt: args.negPrompt,
      model: args.model,
      numIterations: args.numIterations,
      guidanceScale: args.guidanceScale,
      width: args.width,
      height: args.height,
      seed: args.seed,
      status: 'pending',
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.functions.images.callHeuristAPI, {
      imageGenId,
      ...args,
    });

    return imageGenId;
  },
});

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
      // can't use t3 env here, convex doesn't support it apparently
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

export const saveGeneratedImage = internalMutation({
  args: {
    imageGenId: v.id('imageGenerations'),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageGenId, {
      imageUrl: args.imageUrl,
      status: 'completed',
      completedAt: Date.now(),
    });
  },
});

export const markImageAsFailed = internalMutation({
  args: {
    imageGenId: v.id('imageGenerations'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageGenId, {
      status: 'failed',
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const getUserImages = query({
  args: { userAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', args.userAddress))
      .first();

    if (!user) return [];

    return await ctx.db
      .query('imageGenerations')
      .withIndex('by_user', (q) => q.eq('userAddress', user._id))
      .order('desc')
      .collect();
  },
});

export const getImageGeneration = query({
  args: { imageGenId: v.id('imageGenerations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.imageGenId);
  },
});
