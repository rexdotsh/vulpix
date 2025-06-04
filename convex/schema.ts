import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    address: v.string(),
  }).index('by_address', ['address']),

  imageGenerations: defineTable({
    userAddress: v.id('users'),
    prompt: v.string(),
    negPrompt: v.optional(v.string()),
    model: v.string(),
    numIterations: v.optional(v.number()),
    guidanceScale: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    seed: v.optional(v.number()),
    imageUrl: v.optional(v.string()), // optional until image is generated
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    ipfsUrl: v.optional(v.string()), // optional until image is uploaded to IPFS
  }).index('by_user', ['userAddress']),

  nftCollections: defineTable({
    collectionId: v.string(),
    owner: v.string(),
    userAddress: v.id('users'),
    details: v.any(),
    metadata: v.any(),
    lastSynced: v.number(),
  })
    .index('by_user', ['userAddress'])
    .index('by_collection_id', ['collectionId']),

  nftItems: defineTable({
    collectionId: v.string(),
    itemId: v.string(),
    owner: v.string(),
    userAddress: v.id('users'),
    itemDetails: v.any(),
    itemMetadata: v.any(),
    lastSynced: v.number(),
  })
    .index('by_user', ['userAddress'])
    .index('by_collection', ['collectionId'])
    .index('by_item', ['collectionId', 'itemId']),
});
