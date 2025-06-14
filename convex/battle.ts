import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getPolkadotAddressFromEth } from './users';

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

    // set pending turn (optimistic update)
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

    const currentTurnPolkadotAddress = await getPolkadotAddressFromEth(
      ctx,
      args.newGameState.currentTurn,
    );
    if (!currentTurnPolkadotAddress) {
      throw new Error(
        'Could not find Polkadot address for current turn player',
      );
    }

    let winnerPolkadotAddress = args.newGameState.winner;
    if (args.newGameState.winner && args.newGameState.isFinished) {
      const polkadotWinner = await getPolkadotAddressFromEth(
        ctx,
        args.newGameState.winner,
      );
      if (polkadotWinner) {
        winnerPolkadotAddress = polkadotWinner;
      }
    }

    const newMove = {
      turnNumber: args.newGameState.turnNumber,
      player: battle.gameState.pendingTurn?.player || '',
      action: battle.gameState.pendingTurn?.action || 'attack',
      damage: args.moveData.damage,
      wasCritical: args.moveData.wasCritical,
      targetHealth:
        currentTurnPolkadotAddress === battle.player1Address
          ? args.newGameState.player2Health
          : args.newGameState.player1Health,
      txHash: args.txHash,
      timestamp: Date.now(),
    };

    await ctx.db.patch(battle._id, {
      gameState: {
        ...(battle.gameState || {}),
        currentTurn: currentTurnPolkadotAddress,
        player1Health: args.newGameState.player1Health,
        player2Health: args.newGameState.player2Health,
        turnNumber: args.newGameState.turnNumber,
        status: args.newGameState.isFinished ? 'finished' : 'active',
        winner: winnerPolkadotAddress,
        pendingTurn: undefined,
      },
      moves: [...battle.moves, newMove],
      lastActivity: Date.now(),
      finishedAt: args.newGameState.isFinished ? Date.now() : undefined,
    });

    // Award 5 credits to the winner if battle is finished
    if (args.newGameState.isFinished && winnerPolkadotAddress) {
      const winner = await ctx.db
        .query('users')
        .withIndex('by_address', (q) => q.eq('address', winnerPolkadotAddress))
        .first();

      if (winner) {
        const currentCredits = winner.credits || 0;
        await ctx.db.patch(winner._id, {
          credits: currentCredits + 5,
        });
      }
    }

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
