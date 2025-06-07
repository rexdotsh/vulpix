import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    address: v.string(), // polkadot address (primary)
    ethAddress: v.optional(v.string()), // eth address of same account, needed for contract
    linkedAt: v.optional(v.number()),
    profilePicture: v.optional(v.string()), // URL to profile picture stored in Vercel blob
    profilePictureUpdatedAt: v.optional(v.number()),
  })
    .index('by_address', ['address'])
    .index('by_eth_address', ['ethAddress']),

  imageGenerations: defineTable({
    userAddress: v.id('users'),
    prompt: v.string(),
    model: v.string(),
    imageUrl: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    ipfsUrl: v.optional(v.string()),
  }).index('by_user', ['userAddress']),

  lobbies: defineTable({
    lobbyId: v.string(),
    creatorAddress: v.string(),
    creatorName: v.optional(v.string()),

    status: v.union(
      v.literal('waiting'), // waiting for opponent
      v.literal('ready'), // both players joined, waiting for game start
      v.literal('started'), // battle has begun
      v.literal('cancelled'), // creator cancelled
      v.literal('expired'), // auto-expired after timeout
    ),

    settings: v.object({
      isPrivate: v.boolean(), // private = invite only, public = anyone can join
      maxWaitTime: v.number(), // auto-expire after X minutes
    }),

    // Opponent info (when someone joins)
    joinedPlayerAddress: v.optional(v.string()),
    joinedPlayerName: v.optional(v.string()),

    // NFT selections (can change until both ready)
    creatorNFT: v.optional(
      v.object({
        collection: v.string(),
        item: v.string(),
        isReady: v.boolean(),
      }),
    ),
    joinerNFT: v.optional(
      v.object({
        collection: v.string(),
        item: v.string(),
        isReady: v.boolean(),
      }),
    ),

    // Real-time presence
    playersOnline: v.array(v.string()),
    lastActivity: v.number(),

    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_creator', ['creatorAddress'])
    .index('by_public', ['settings.isPrivate', 'status']),

  battles: defineTable({
    battleId: v.string(),
    contractBattleId: v.optional(v.string()), // the on-chain battle ID from contract event

    // Players
    player1Address: v.string(),
    player2Address: v.string(),
    player1Name: v.optional(v.string()),
    player2Name: v.optional(v.string()),

    // NFTs locked in at battle start
    player1NFT: v.object({
      collection: v.string(),
      item: v.string(),
      stats: v.object({
        attack: v.number(),
        defense: v.number(),
        intelligence: v.number(),
        luck: v.number(),
        speed: v.number(),
        strength: v.number(),
        nftType: v.number(),
        maxHealth: v.number(),
        generatedAt: v.number(),
      }),
    }),
    player2NFT: v.object({
      collection: v.string(),
      item: v.string(),
      stats: v.object({
        attack: v.number(),
        defense: v.number(),
        intelligence: v.number(),
        luck: v.number(),
        speed: v.number(),
        strength: v.number(),
        nftType: v.number(),
        maxHealth: v.number(),
        generatedAt: v.number(),
      }),
    }),

    // Game state (mirrors blockchain but with UI enhancements)
    gameState: v.object({
      currentTurn: v.string(), // player address whose turn it is
      player1Health: v.number(),
      player2Health: v.number(),
      player1MaxHealth: v.number(),
      player2MaxHealth: v.number(),
      turnNumber: v.number(),

      status: v.union(
        v.literal('initializing'), // contract call in progress
        v.literal('active'), // battle is live
        v.literal('finished'), // battle completed
        v.literal('abandoned'), // player disconnected too long
      ),

      winner: v.optional(v.string()),

      // Track pending blockchain transaction
      pendingTurn: v.optional(
        v.object({
          player: v.string(),
          txHash: v.optional(v.string()),
          timestamp: v.number(),
          action: v.string(), // "attack", "createBattle", etc.
        }),
      ),
    }),

    // Move history (for replay/analysis)
    moves: v.array(
      v.object({
        turnNumber: v.number(),
        player: v.string(),
        action: v.string(),
        damage: v.optional(v.number()),
        wasCritical: v.optional(v.boolean()),
        targetHealth: v.optional(v.number()),
        txHash: v.string(),
        timestamp: v.number(),
      }),
    ),

    // Real-time connection tracking
    playersOnline: v.array(v.string()),
    lastActivity: v.number(),

    // Blockchain state
    contractCreated: v.boolean(),
    creationTxHash: v.optional(v.string()),

    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index('by_player1', ['player1Address'])
    .index('by_player2', ['player2Address'])
    .index('by_status', ['gameState.status'])
    .index('by_contract_id', ['contractBattleId']),

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
    stats: v.optional(
      v.object({
        attack: v.number(),
        defense: v.number(),
        intelligence: v.number(),
        luck: v.number(),
        speed: v.number(),
        strength: v.number(),
        nftType: v.number(), // 0 = fire, 1 = water, 2 = grass
        maxHealth: v.number(),
        generatedAt: v.number(), // timestamp when stats were generated
      }),
    ),
    lastSynced: v.number(),
  })
    .index('by_user', ['userAddress'])
    .index('by_collection', ['collectionId'])
    .index('by_item', ['collectionId', 'itemId']),
});
