import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// LOBBY SYSTEM
const requireLinkedAddresses = async (ctx: any, polkadotAddress: string) => {
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

export const createLobby = mutation({
  args: {
    creatorAddress: v.string(),
    creatorName: v.optional(v.string()),
    isPrivate: v.boolean(),
    maxWaitTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user has linked addresses
    await requireLinkedAddresses(ctx, args.creatorAddress);

    const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = Date.now();
    const waitTime = args.maxWaitTime || 10 * 60 * 1000; // 10 minutes default

    const id = await ctx.db.insert('lobbies', {
      lobbyId,
      creatorAddress: args.creatorAddress,
      creatorName: args.creatorName,
      status: 'waiting',
      settings: {
        isPrivate: args.isPrivate,
        maxWaitTime: waitTime,
      },
      playersOnline: [args.creatorAddress],
      lastActivity: now,
      createdAt: now,
      expiresAt: now + waitTime,
    });

    return { lobbyId, _id: id };
  },
});

export const joinLobby = mutation({
  args: {
    lobbyId: v.string(),
    playerAddress: v.string(),
    playerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user has linked addresses
    await requireLinkedAddresses(ctx, args.playerAddress);

    const lobby = await ctx.db
      .query('lobbies')
      .filter((q) => q.eq(q.field('lobbyId'), args.lobbyId))
      .first();

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Lobby is not accepting players');
    }

    if (lobby.creatorAddress === args.playerAddress) {
      throw new Error('Cannot join your own lobby');
    }

    if (lobby.joinedPlayerAddress) {
      throw new Error('Lobby is full');
    }

    await ctx.db.patch(lobby._id, {
      joinedPlayerAddress: args.playerAddress,
      joinedPlayerName: args.playerName,
      playersOnline: [lobby.creatorAddress, args.playerAddress],
      lastActivity: Date.now(),
    });

    return { success: true };
  },
});

export const getUserLinkStatus = query({
  args: { polkadotAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_address', (q) => q.eq('address', args.polkadotAddress))
      .first();

    return {
      hasUser: !!user,
      hasLinkedEthAddress: !!user?.ethAddress,
      ethAddress: user?.ethAddress,
      linkedAt: user?.linkedAt,
    };
  },
});

export const updateLobbyNFT = mutation({
  args: {
    lobbyId: v.string(),
    playerAddress: v.string(),
    nftCollection: v.string(),
    nftItem: v.string(),
    isReady: v.boolean(),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db
      .query('lobbies')
      .filter((q) => q.eq(q.field('lobbyId'), args.lobbyId))
      .first();

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    const nftData = {
      collection: args.nftCollection,
      item: args.nftItem,
      isReady: args.isReady,
    };

    if (args.playerAddress === lobby.creatorAddress) {
      await ctx.db.patch(lobby._id, {
        creatorNFT: nftData,
        lastActivity: Date.now(),
      });
    } else if (args.playerAddress === lobby.joinedPlayerAddress) {
      await ctx.db.patch(lobby._id, {
        joinerNFT: nftData,
        lastActivity: Date.now(),
      });
    } else {
      throw new Error('Player not in this lobby');
    }

    // Check if both players are ready
    const updatedLobby = await ctx.db.get(lobby._id);
    if (updatedLobby?.creatorNFT?.isReady && updatedLobby?.joinerNFT?.isReady) {
      await ctx.db.patch(lobby._id, {
        status: 'ready',
      });
    }

    return { success: true };
  },
});

export const startBattleFromLobby = mutation({
  args: {
    lobbyId: v.string(),
    initiatorAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db
      .query('lobbies')
      .filter((q) => q.eq(q.field('lobbyId'), args.lobbyId))
      .first();

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (lobby.status !== 'ready') {
      throw new Error('Lobby is not ready to start battle');
    }

    if (!lobby.joinedPlayerAddress) {
      throw new Error(
        'Lobby is ready but joined player address is missing. This indicates an inconsistent lobby state.',
      );
    }

    if (!lobby.creatorNFT?.isReady || !lobby.joinerNFT?.isReady) {
      throw new Error('Both players must be ready');
    }

    // Generate battle ID
    const battleId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = Date.now();

    // Generate stats for both NFTs (using the same logic as before)
    const generateStatsFromNFT = (collection: string, item: string) => {
      const hash = `${collection}${item}`;
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
        maxHealth: 0, // will be calculated
      };

      stats.maxHealth = Math.floor(
        50 + stats.strength * 0.5 + stats.defense * 0.3,
      );
      return stats;
    };

    const player1Stats = generateStatsFromNFT(
      lobby.creatorNFT.collection,
      lobby.creatorNFT.item,
    );
    const player2Stats = generateStatsFromNFT(
      lobby.joinerNFT.collection,
      lobby.joinerNFT.item,
    );

    // Determine who goes first (higher speed)
    const firstPlayer =
      player1Stats.speed >= player2Stats.speed
        ? lobby.creatorAddress
        : lobby.joinedPlayerAddress;

    // Create battle
    const battleDbId = await ctx.db.insert('battles', {
      battleId,
      player1Address: lobby.creatorAddress,
      player2Address: lobby.joinedPlayerAddress,
      player1Name: lobby.creatorName,
      player2Name: lobby.joinedPlayerName,

      player1NFT: {
        collection: lobby.creatorNFT.collection,
        item: lobby.creatorNFT.item,
        stats: player1Stats,
      },
      player2NFT: {
        collection: lobby.joinerNFT.collection,
        item: lobby.joinerNFT.item,
        stats: player2Stats,
      },

      gameState: {
        currentTurn: firstPlayer,
        player1Health: player1Stats.maxHealth,
        player2Health: player2Stats.maxHealth,
        player1MaxHealth: player1Stats.maxHealth,
        player2MaxHealth: player2Stats.maxHealth,
        turnNumber: 0,
        status: 'initializing', // will become 'active' after contract creation
      },

      moves: [],
      playersOnline: [lobby.creatorAddress, lobby.joinedPlayerAddress],
      lastActivity: now,
      contractCreated: false,
      createdAt: now,
    });

    // Mark lobby as started
    await ctx.db.patch(lobby._id, {
      status: 'started',
    });

    return {
      battleId,
      battleDbId,
      player1Stats,
      player2Stats,
      firstPlayer,
    };
  },
});

// BATTLE SYSTEM

export const updateBattleContractInfo = mutation({
  args: {
    battleId: v.string(),
    contractBattleId: v.string(),
    creationTxHash: v.string(),
  },
  handler: async (ctx, args) => {
    const battle = await ctx.db
      .query('battles')
      .filter((q) => q.eq(q.field('battleId'), args.battleId))
      .first();

    if (!battle) {
      throw new Error('Battle not found');
    }

    await ctx.db.patch(battle._id, {
      contractBattleId: args.contractBattleId,
      creationTxHash: args.creationTxHash,
      contractCreated: true,
      gameState: {
        ...(battle.gameState || {}),
        status: 'active',
      },
      startedAt: Date.now(),
    });

    return { success: true };
  },
});

export const executeTurn = mutation({
  args: {
    battleId: v.string(),
    playerAddress: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const battle = await ctx.db
      .query('battles')
      .filter((q) => q.eq(q.field('battleId'), args.battleId))
      .first();

    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.gameState.status !== 'active') {
      throw new Error('Battle is not active');
    }

    if (battle.gameState.currentTurn !== args.playerAddress) {
      throw new Error('Not your turn');
    }

    if (battle.gameState.pendingTurn) {
      throw new Error('Previous turn still pending');
    }

    // Set pending turn (optimistic update)
    await ctx.db.patch(battle._id, {
      gameState: {
        ...(battle.gameState || {}),
        pendingTurn: {
          player: args.playerAddress,
          timestamp: Date.now(),
          action: args.action,
        },
      },
      lastActivity: Date.now(),
    });

    return { success: true };
  },
});

export const updateTurnResult = mutation({
  args: {
    battleId: v.string(),
    txHash: v.string(),
    newGameState: v.object({
      currentTurn: v.string(),
      player1Health: v.number(),
      player2Health: v.number(),
      turnNumber: v.number(),
      isFinished: v.boolean(),
      winner: v.optional(v.string()),
    }),
    moveData: v.object({
      damage: v.optional(v.number()),
      wasCritical: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const battle = await ctx.db
      .query('battles')
      .filter((q) => q.eq(q.field('battleId'), args.battleId))
      .first();

    if (!battle) {
      throw new Error('Battle not found');
    }

    // Add move to history
    const newMove = {
      turnNumber: args.newGameState.turnNumber,
      player: battle.gameState.pendingTurn?.player || '',
      action: battle.gameState.pendingTurn?.action || 'attack',
      damage: args.moveData.damage,
      wasCritical: args.moveData.wasCritical,
      targetHealth:
        args.newGameState.currentTurn === battle.player1Address
          ? args.newGameState.player2Health
          : args.newGameState.player1Health,
      txHash: args.txHash,
      timestamp: Date.now(),
    };

    // Update battle state
    await ctx.db.patch(battle._id, {
      gameState: {
        ...(battle.gameState || {}),
        currentTurn: args.newGameState.currentTurn,
        player1Health: args.newGameState.player1Health,
        player2Health: args.newGameState.player2Health,
        turnNumber: args.newGameState.turnNumber,
        status: args.newGameState.isFinished ? 'finished' : 'active',
        winner: args.newGameState.winner,
        pendingTurn: undefined,
      },
      moves: [...battle.moves, newMove],
      lastActivity: Date.now(),
      finishedAt: args.newGameState.isFinished ? Date.now() : undefined,
    });

    return { success: true };
  },
});

export const revertPendingTurn = mutation({
  args: {
    battleId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const battle = await ctx.db
      .query('battles')
      .filter((q) => q.eq(q.field('battleId'), args.battleId))
      .first();

    if (!battle) {
      throw new Error('Battle not found');
    }

    await ctx.db.patch(battle._id, {
      gameState: {
        ...(battle.gameState || {}),
        pendingTurn: undefined,
      },
      lastActivity: Date.now(),
    });

    return { success: true };
  },
});

// QUERIES

export const getLobby = query({
  args: { lobbyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('lobbies')
      .filter((q) => q.eq(q.field('lobbyId'), args.lobbyId))
      .first();
  },
});

export const getPublicLobbies = query({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query('lobbies')
      .withIndex('by_public')
      .filter((q) =>
        q.and(
          q.eq(q.field('settings.isPrivate'), false),
          q.eq(q.field('status'), 'waiting'),
          q.gt(q.field('expiresAt'), now),
        ),
      )
      .order('desc')
      .take(20);
  },
});

export const getBattle = query({
  args: { battleId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('battles')
      .filter((q) => q.eq(q.field('battleId'), args.battleId))
      .first();
  },
});

export const getUserActiveBattles = query({
  args: { userAddress: v.string() },
  handler: async (ctx, args) => {
    const battles1 = await ctx.db
      .query('battles')
      .withIndex('by_player1')
      .filter((q) =>
        q.and(
          q.eq(q.field('player1Address'), args.userAddress),
          q.neq(q.field('gameState.status'), 'finished'),
        ),
      )
      .collect();

    const battles2 = await ctx.db
      .query('battles')
      .withIndex('by_player2')
      .filter((q) =>
        q.and(
          q.eq(q.field('player2Address'), args.userAddress),
          q.neq(q.field('gameState.status'), 'finished'),
        ),
      )
      .collect();

    return [...battles1, ...battles2].sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUserBattleHistory = query({
  args: { userAddress: v.string() },
  handler: async (ctx, args) => {
    const battles1 = await ctx.db
      .query('battles')
      .withIndex('by_player1')
      .filter((q) =>
        q.and(
          q.eq(q.field('player1Address'), args.userAddress),
          q.eq(q.field('gameState.status'), 'finished'),
        ),
      )
      .order('desc')
      .take(50);

    const battles2 = await ctx.db
      .query('battles')
      .withIndex('by_player2')
      .filter((q) =>
        q.and(
          q.eq(q.field('player2Address'), args.userAddress),
          q.eq(q.field('gameState.status'), 'finished'),
        ),
      )
      .order('desc')
      .take(50);

    return [...battles1, ...battles2]
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
      .slice(0, 50);
  },
});
