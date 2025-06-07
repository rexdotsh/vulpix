import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { DatabaseReader } from './_generated/server';

export async function getUserId(
  ctx: { db: DatabaseReader },
  address: string,
): Promise<Id<'users'> | null> {
  if (!address) return null;

  const user = await ctx.db
    .query('users')
    .withIndex('by_address', (q: any) => q.eq('address', address))
    .first();

  return user?._id || null;
}

export const createOrGetUser = mutation({
  args: {
    address: v.string(),
  },
  handler: async (ctx, { address }) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', address))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert('users', {
      address,
    });

    return userId;
  },
});

export const getUser = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, { address }) => {
    return ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', address))
      .first();
  },
});

export const linkEthereumAddress = mutation({
  args: {
    polkadotAddress: v.string(),
    ethereumAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', args.polkadotAddress))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const normalizedEthAddress = args.ethereumAddress.toLowerCase();

    await ctx.db.patch(user._id, {
      ethAddress: normalizedEthAddress,
      linkedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getUserByEthAddress = query({
  args: { ethAddress: v.string() },
  handler: async (ctx, args) => {
    const normalizedEthAddress = args.ethAddress.toLowerCase();

    return await ctx.db
      .query('users')
      .withIndex('by_eth_address', (q) =>
        q.eq('ethAddress', normalizedEthAddress),
      )
      .first();
  },
});

export const requireLinkedAddresses = async (
  ctx: any,
  polkadotAddress: string,
) => {
  const user = await ctx.db
    .query('users')
    .withIndex('by_address', (q: any) => q.eq('address', polkadotAddress))
    .first();

  if (!user) {
    throw new Error('User not found. Please connect your wallet first.');
  }

  if (!user.ethAddress) {
    throw new Error(
      'Please link your Ethereum address before joining battles.',
    );
  }

  return user;
};

export const getPolkadotAddressFromEth = async (
  ctx: any,
  ethAddress: string,
): Promise<string | null> => {
  const normalizedEthAddress = ethAddress.toLowerCase();

  const user = await ctx.db
    .query('users')
    .withIndex('by_eth_address', (q: any) =>
      q.eq('ethAddress', normalizedEthAddress),
    )
    .first();

  return user?.address || null;
};

export const updateProfilePicture = mutation({
  args: {
    address: v.string(),
    profilePictureUrl: v.string(),
  },
  handler: async (ctx, { address, profilePictureUrl }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', address))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      profilePicture: profilePictureUrl,
      profilePictureUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const removeProfilePicture = mutation({
  args: {
    address: v.string(),
  },
  handler: async (ctx, { address }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', address))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      profilePicture: undefined,
      profilePictureUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});
