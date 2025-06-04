import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { DatabaseReader } from '../_generated/server';

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
