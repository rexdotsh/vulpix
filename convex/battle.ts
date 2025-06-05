import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createBattleRoom = mutation({
  args: {
    roomId: v.string(),
    nftCollection: v.string(),
    nftItem: v.string(),
    userAddress: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('battleRooms', {
      roomId: args.roomId,
      inviterAddress: args.userAddress,
      inviterNftCollection: args.nftCollection,
      inviterNftItem: args.nftItem,
      roomFull: false,
      createdAt: Date.now(),
    });
  },
});

export const getBattleRoom = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('battleRooms')
      .filter((q) => q.eq(q.field('roomId'), args.roomId))
      .first();
    return room;
  },
});

export const updateRoomStatus = mutation({
  args: {
    roomId: v.string(),
    roomFull: v.boolean(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('battleRooms')
      .filter((q) => q.eq(q.field('roomId'), args.roomId))
      .first();

    if (room) {
      await ctx.db.patch(room._id, {
        roomFull: args.roomFull,
      });
    }
  },
});

export const joinBattleRoom = mutation({
  args: {
    roomId: v.string(),
    joinerAddress: v.string(),
    joinerEthAddress: v.string(),
    joinerNftCollection: v.string(),
    joinerNftItem: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('battleRooms')
      .filter((q) => q.eq(q.field('roomId'), args.roomId))
      .first();

    if (room && !room.roomFull) {
      await ctx.db.patch(room._id, {
        joinerAddress: args.joinerAddress,
        joinerEthAddress: args.joinerEthAddress,
        joinerNftCollection: args.joinerNftCollection,
        joinerNftItem: args.joinerNftItem,
        roomFull: true,
      });
    }
  },
});
