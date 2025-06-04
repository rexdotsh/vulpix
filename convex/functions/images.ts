import { v } from 'convex/values';
import { mutation, internalMutation, query } from '../_generated/server';
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

    const { userAddress, ...rest } = args;
    await ctx.scheduler.runAfter(
      0,
      internal.functions.heuristGen.callHeuristAPI,
      { imageGenId, ...rest },
    );

    return imageGenId;
  },
});

export const uploadImageToIpfs = mutation({
  args: {
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.functions.ipfsUpload.ipfsUpload, {
      imageUrl: args.imageUrl,
    });

    return { scheduled: true };
  },
});

export const saveIpfsUpload = internalMutation({
  args: {
    originalUrl: v.string(),
    cid: v.string(),
    ipfsUrl: v.string(),
    createdAt: v.number(),
  },
  handler: (ctx, args) => {
    return ctx.db.insert('ipfsUploads', args);
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

// TODO: history page on @/generate
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
