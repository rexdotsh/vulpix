'use node';

import { internalAction, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { nftMoveSchema } from './schema';

const NFT_TYPE_NAMES = {
  0: 'Fire',
  1: 'Water',
  2: 'Grass',
} as const;

type NFTTypeName = (typeof NFT_TYPE_NAMES)[keyof typeof NFT_TYPE_NAMES];

interface NFTStats {
  attack: number;
  defense: number;
  intelligence: number;
  luck: number;
  speed: number;
  strength: number;
}

interface GeneratedMove {
  name: string;
  description: string;
}

export const generateNFTMoves = internalAction({
  args: {
    collectionId: v.string(),
    itemId: v.string(),
    nftType: v.number(),
    stats: v.object({
      attack: v.number(),
      defense: v.number(),
      intelligence: v.number(),
      luck: v.number(),
      speed: v.number(),
      strength: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    try {
      const { google } = await import('@ai-sdk/google');
      const { generateText } = await import('ai');

      const nftTypeName =
        NFT_TYPE_NAMES[args.nftType as keyof typeof NFT_TYPE_NAMES] ||
        'Neutral';

      // Create XML-formatted prompt for better AI performance
      const prompt = `<task>
Generate 4 unique battle moves for an NFT character with specific attributes.
</task>

<nft_characteristics>
  <type>${nftTypeName}</type>
  <stats>
    <attack>${args.stats.attack}</attack>
    <defense>${args.stats.defense}</defense>
    <intelligence>${args.stats.intelligence}</intelligence>
    <luck>${args.stats.luck}</luck>
    <speed>${args.stats.speed}</speed>
    <strength>${args.stats.strength}</strength>
  </stats>
</nft_characteristics>

<requirements>
  <move_count>exactly 4 moves</move_count>
  <name_format>exactly 2 words (no more, no less)</name_format>
  <description_length>10-20 words maximum</description_length>
  <language_style>simple, clear language</language_style>
  <move_theme>reflect NFT type (${nftTypeName}) and strongest stats</move_theme>
  <creativity>unique and creative, not generic</creativity>
</requirements>

<output_format>
Return ONLY a JSON array with this exact structure:
[
  {"name": "Two Words", "description": "Simple description under 20 words"},
  {"name": "Two Words", "description": "Simple description under 20 words"},
  {"name": "Two Words", "description": "Simple description under 20 words"},
  {"name": "Two Words", "description": "Simple description under 20 words"}
]
</output_format>

Generate the moves now:`;

      const result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        prompt,
      });

      let generatedMoves: GeneratedMove[];
      try {
        // Try to parse the JSON response
        const cleanedResponse = result.text.trim();
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            generatedMoves = parsed as GeneratedMove[];
          } else {
            throw new Error('Response is not an array');
          }
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (parseError: unknown) {
        console.error('Failed to parse AI response:', result.text);
        console.error('Parse error:', parseError);
        // Fallback to default moves if parsing fails - COMMENTED OUT FOR TESTING
        // generatedMoves = generateFallbackMoves(nftTypeName, args.stats);
        throw new Error(`Failed to parse AI response: ${parseError}`);
      }

      // Validate and clean the moves
      const validatedMoves = validateAndCleanMoves(
        generatedMoves,
        nftTypeName,
        args.stats,
      );

      return { moves: validatedMoves };
    } catch (error: unknown) {
      console.error('Error generating NFT moves:', error);

      // Fallback to default moves on any error - COMMENTED OUT FOR TESTING
      // const nftTypeName =
      //   NFT_TYPE_NAMES[args.nftType as keyof typeof NFT_TYPE_NAMES] ||
      //   'Neutral';
      // const fallbackMoves = generateFallbackMoves(nftTypeName, args.stats);

      // return { moves: fallbackMoves };
      throw error;
    }
  },
});

function validateAndCleanMoves(
  moves: GeneratedMove[],
  nftTypeName: NFTTypeName | 'Neutral',
  stats: NFTStats,
): GeneratedMove[] {
  const validatedMoves: GeneratedMove[] = [];

  for (let i = 0; i < Math.min(moves.length, 4); i++) {
    const move = moves[i];
    if (
      move &&
      typeof move.name === 'string' &&
      typeof move.description === 'string'
    ) {
      // Ensure name is exactly 2 words
      const nameWords = move.name.trim().split(/\s+/);
      const cleanName = nameWords.slice(0, 2).join(' ');

      // Ensure description is under 20 words
      const descWords = move.description.trim().split(/\s+/);
      const cleanDescription = descWords.slice(0, 20).join(' ');

      validatedMoves.push({
        name: cleanName,
        description: cleanDescription,
      });
    }
  }

  // Fill remaining slots with fallback moves if needed - COMMENTED OUT FOR TESTING
  // while (validatedMoves.length < 4) {
  //   const fallbacks = generateFallbackMoves(nftTypeName, stats);
  //   const fallbackMove = fallbacks[validatedMoves.length % fallbacks.length];
  //   validatedMoves.push(fallbackMove);
  // }

  return validatedMoves;
}

function generateFallbackMoves(
  nftTypeName: NFTTypeName | 'Neutral',
  stats: NFTStats,
): GeneratedMove[] {
  const baseMoves: GeneratedMove[] = [
    {
      name: 'Basic Strike',
      description: 'A simple but effective physical attack.',
    },
    {
      name: 'Quick Dash',
      description: 'Fast movement followed by a swift attack.',
    },
    {
      name: 'Guard Stance',
      description: 'Defensive position that reduces incoming damage.',
    },
    {
      name: 'Power Surge',
      description: 'Channel inner strength for increased damage.',
    },
  ];

  // Type-specific moves
  const typeMoves: Record<NFTTypeName, GeneratedMove[]> = {
    Fire: [
      {
        name: 'Flame Burst',
        description: 'Intense fire attack that burns enemies.',
      },
      { name: 'Heat Wave', description: 'Scorching blast of superheated air.' },
    ],
    Water: [
      {
        name: 'Hydro Blast',
        description: 'Powerful stream of pressurized water.',
      },
      {
        name: 'Tidal Force',
        description: 'Overwhelming wave that crashes down.',
      },
    ],
    Grass: [
      {
        name: 'Vine Whip',
        description: 'Swift strike using natural plant tendrils.',
      },
      {
        name: 'Nature Heal',
        description: 'Draw power from earth to restore energy.',
      },
    ],
  };

  const typeSpecific =
    nftTypeName !== 'Neutral' ? typeMoves[nftTypeName] || [] : [];
  return [...typeSpecific, ...baseMoves].slice(0, 4);
}

// Mutation to store generated moves
export const generateAndStoreMoves = internalAction({
  args: {
    nftId: v.id('nftItems'),
    collectionId: v.string(),
    itemId: v.string(),
    nftType: v.number(),
    stats: v.object({
      attack: v.number(),
      defense: v.number(),
      intelligence: v.number(),
      luck: v.number(),
      speed: v.number(),
      strength: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Generate the moves using AI
    const result = await ctx.runAction(internal.aiMoves.generateNFTMoves, {
      collectionId: args.collectionId,
      itemId: args.itemId,
      nftType: args.nftType,
      stats: args.stats,
    });

    // Store the moves in the database
    if (result?.moves) {
      await ctx.runMutation(internal.aiMoves.storeMoves, {
        nftId: args.nftId,
        moves: result.moves,
      });
    }
  },
});

export const storeMoves = internalMutation({
  args: {
    nftId: v.id('nftItems'),
    moves: v.array(nftMoveSchema),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.nftId, {
      moves: args.moves,
    });
  },
});
