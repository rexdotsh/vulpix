import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getUserId } from './users';

function generateNFTStats(collectionId: string, itemId: string, metadata: any) {
  // create a hash from collection, item, and metadata
  const metadataStr = metadata?.name || metadata?.description || '';
  const hash = `${metadataStr}${collectionId}${itemId}`;

  let hashValue = 0;
  for (let i = 0; i < hash.length; i++) {
    hashValue = hashValue * 31 + hash.charCodeAt(i);
  }

  const rand = (min: number, max: number, seed: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const stats = {
    attack: rand(20, 80, hashValue + 1),
    defense: rand(20, 80, hashValue + 2),
    intelligence: rand(10, 60, hashValue + 3),
    luck: rand(5, 50, hashValue + 5),
    speed: rand(10, 70, hashValue + 6),
    strength: rand(20, 80, hashValue + 7),
    nftType: Math.abs(hashValue) % 3,
    maxHealth: 0,
    generatedAt: Date.now(),
  };

  // TODO: correct?
  stats.maxHealth = Math.floor(50 + stats.strength * 0.5 + stats.defense * 0.3);

  return stats;
}

export const getUserNFTs = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, { address }) => {
    const userId = await getUserId(ctx, address);
    if (!userId) return [];

    const nftItems = await ctx.db
      .query('nftItems')
      .withIndex('by_user', (q) => q.eq('userAddress', userId))
      .collect();

    const collections = new Map();
    for (const item of nftItems) {
      if (!collections.has(item.collectionId)) {
        const collection = await ctx.db
          .query('nftCollections')
          .withIndex('by_collection_id', (q) =>
            q.eq('collectionId', item.collectionId),
          )
          .first();

        if (collection) {
          collections.set(item.collectionId, collection);
        }
      }
    }

    return nftItems.map((item) => ({
      collection: item.collectionId,
      item: item.itemId,
      owner: item.owner,
      itemDetails: item.itemDetails,
      itemMetadata: item.itemMetadata,
      collectionMetadata: collections.get(item.collectionId)?.metadata || null,
      stats: item.stats,
      lastSynced: item.lastSynced,
    }));
  },
});

export const getUserCollections = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, { address }) => {
    const userId = await getUserId(ctx, address);
    if (!userId) return [];

    return ctx.db
      .query('nftCollections')
      .withIndex('by_user', (q) => q.eq('userAddress', userId))
      .collect();
  },
});

export const syncUserNFTs = mutation({
  args: {
    address: v.string(),
    nfts: v.array(
      v.object({
        collection: v.string(),
        item: v.string(),
        owner: v.string(),
        itemDetails: v.any(),
        itemMetadata: v.any(),
        collectionMetadata: v.any(),
      }),
    ),
  },
  handler: async (ctx, { address, nfts }) => {
    const userId = await getUserId(ctx, address);
    if (!userId) {
      throw new Error(`User with address ${address} not found`);
    }

    const now = Date.now();
    const collections = new Map();

    for (const nft of nfts) {
      if (!collections.has(nft.collection)) {
        collections.set(nft.collection, {
          collectionId: nft.collection,
          owner: nft.owner,
          userAddress: userId,
          details: {},
          metadata: nft.collectionMetadata,
          lastSynced: now,
        });
      }

      const existingNft = await ctx.db
        .query('nftItems')
        .withIndex('by_item', (q) =>
          q.eq('collectionId', nft.collection).eq('itemId', nft.item),
        )
        .first();

      const stats = generateNFTStats(
        nft.collection,
        nft.item,
        nft.itemMetadata,
      );

      if (existingNft) {
        // update existing NFT with fresh stats
        await ctx.db.patch(existingNft._id, {
          owner: nft.owner,
          itemDetails: nft.itemDetails,
          itemMetadata: nft.itemMetadata,
          stats,
          lastSynced: now,
        });
      } else {
        // create new NFT with stats
        await ctx.db.insert('nftItems', {
          collectionId: nft.collection,
          itemId: nft.item,
          owner: nft.owner,
          userAddress: userId,
          itemDetails: nft.itemDetails,
          itemMetadata: nft.itemMetadata,
          stats,
          lastSynced: now,
        });
      }
    }

    for (const [collectionId, collectionData] of collections.entries()) {
      const existingCollection = await ctx.db
        .query('nftCollections')
        .withIndex('by_collection_id', (q) =>
          q.eq('collectionId', collectionId),
        )
        .first();

      if (existingCollection) {
        await ctx.db.patch(existingCollection._id, {
          metadata: collectionData.metadata,
          lastSynced: now,
        });
      } else {
        await ctx.db.insert('nftCollections', collectionData);
      }
    }

    return { success: true, syncedAt: now, nftCount: nfts.length };
  },
});

export const syncUserCollections = mutation({
  args: {
    address: v.string(),
    collections: v.array(
      v.object({
        id: v.string(),
        owner: v.string(),
        details: v.any(),
        metadata: v.any(),
      }),
    ),
  },
  handler: async (ctx, { address, collections }) => {
    const userId = await getUserId(ctx, address);
    if (!userId) {
      throw new Error(`User with address ${address} not found`);
    }

    const now = Date.now();

    for (const collection of collections) {
      const existingCollection = await ctx.db
        .query('nftCollections')
        .withIndex('by_collection_id', (q) =>
          q.eq('collectionId', collection.id),
        )
        .first();

      if (existingCollection) {
        await ctx.db.patch(existingCollection._id, {
          owner: collection.owner,
          details: collection.details,
          metadata: collection.metadata,
          lastSynced: now,
        });
      } else {
        await ctx.db.insert('nftCollections', {
          collectionId: collection.id,
          owner: collection.owner,
          userAddress: userId,
          details: collection.details,
          metadata: collection.metadata,
          lastSynced: now,
        });
      }
    }

    return {
      success: true,
      syncedAt: now,
      collectionCount: collections.length,
    };
  },
});

export const getLastSyncTime = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, { address }) => {
    const userId = await getUserId(ctx, address);
    if (!userId) return null;

    const latestNft = await ctx.db
      .query('nftItems')
      .withIndex('by_user', (q) => q.eq('userAddress', userId))
      .order('desc')
      .first();

    const latestCollection = await ctx.db
      .query('nftCollections')
      .withIndex('by_user', (q) => q.eq('userAddress', userId))
      .order('desc')
      .first();

    const nftTime = latestNft?.lastSynced || 0;
    const collectionTime = latestCollection?.lastSynced || 0;

    return Math.max(nftTime, collectionTime) || null;
  },
});
