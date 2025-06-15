export interface BattleMove {
  name: string;
  description: string;
  power?: number; // Made optional since AI moves might not have power
  type?: string; // Made optional
  iconName?: string; // Made optional
}

export interface NFTStats {
  attack: number;
  defense: number;
  intelligence: number;
  luck: number;
  speed: number;
  strength: number;
  nftType: number;
  maxHealth: number;
  generatedAt: number;
}

export interface NFTWithMoves {
  stats: NFTStats;
  moves?: BattleMove[];
}

// Generate moves for NFTs - now uses custom AI moves if available
export function generateMoves(nftWithMoves: NFTWithMoves): BattleMove[] {
  const { stats, moves } = nftWithMoves;

  // If NFT has custom AI-generated moves, use those with calculated power
  if (moves && moves.length > 0) {
    return moves.map((move, index) => ({
      name: move.name,
      description: move.description,
      power: calculateMovePower(stats, index), // Calculate power based on stats and move position
      type: determineRoleType(stats, index),
      iconName: getIconForMove(move.name, stats.nftType),
    }));
  }

  // Fallback to generic moves if no custom moves available
  return generateGenericMoves(stats);
}

// Calculate power for AI-generated moves based on NFT stats
function calculateMovePower(stats: NFTStats, moveIndex: number): number {
  const basePowers = [25, 20, 18, 15]; // First move is strongest
  const basePower = basePowers[moveIndex] || 15;

  // Factor in strongest stats for power calculation
  const statBonus =
    Math.max(stats.attack, stats.strength, stats.intelligence) * 0.5;

  return Math.floor(basePower + statBonus);
}

// Determine move type based on stats and position
function determineRoleType(stats: NFTStats, moveIndex: number): string {
  if (moveIndex === 0) return getTypeForNFTType(stats.nftType);
  if (stats.intelligence > stats.attack) return 'special';
  if (stats.defense > stats.attack) return 'support';
  return 'physical';
}

// Get appropriate icon for AI-generated move
function getIconForMove(moveName: string, nftType: number): string {
  const lowerName = moveName.toLowerCase();

  // Type-specific icons
  if (
    nftType === 0 &&
    (lowerName.includes('fire') ||
      lowerName.includes('flame') ||
      lowerName.includes('burn'))
  ) {
    return 'Flame';
  }
  if (
    nftType === 1 &&
    (lowerName.includes('water') ||
      lowerName.includes('hydro') ||
      lowerName.includes('wave'))
  ) {
    return 'Water';
  }
  if (
    nftType === 2 &&
    (lowerName.includes('nature') ||
      lowerName.includes('vine') ||
      lowerName.includes('growth'))
  ) {
    return 'Grass';
  }

  // Generic icons based on keywords
  if (
    lowerName.includes('strike') ||
    lowerName.includes('slash') ||
    lowerName.includes('cut')
  )
    return 'Swords';
  if (
    lowerName.includes('guard') ||
    lowerName.includes('shield') ||
    lowerName.includes('defend')
  )
    return 'Shield';
  if (
    lowerName.includes('speed') ||
    lowerName.includes('quick') ||
    lowerName.includes('dash')
  )
    return 'Zap';
  if (
    lowerName.includes('mind') ||
    lowerName.includes('psychic') ||
    lowerName.includes('mental')
  )
    return 'Brain';
  if (
    lowerName.includes('power') ||
    lowerName.includes('energy') ||
    lowerName.includes('surge')
  )
    return 'Star';

  // Default icon
  return 'Swords';
}

function getTypeForNFTType(nftType: number): string {
  switch (nftType) {
    case 0:
      return 'fire';
    case 1:
      return 'water';
    case 2:
      return 'grass';
    default:
      return 'normal';
  }
}

// Fallback generic move generation (kept for compatibility)
function generateGenericMoves(stats: NFTStats): BattleMove[] {
  const moves: BattleMove[] = [];

  // Basic attack - always available
  moves.push({
    name: 'Strike',
    description: 'A basic physical attack using raw strength.',
    power: Math.floor(20 + stats.attack * 0.8),
    type: 'physical',
    iconName: 'Swords',
  });

  // Stat-based moves
  if (stats.intelligence >= 40) {
    moves.push({
      name: 'Mind Blast',
      description: 'A psychic attack that deals damage based on intelligence.',
      power: Math.floor(15 + stats.intelligence * 1.2),
      type: 'special',
      iconName: 'Brain',
    });
  }

  if (stats.speed >= 35) {
    moves.push({
      name: 'Swift Strike',
      description: 'A lightning-fast attack that rarely misses.',
      power: Math.floor(18 + stats.speed * 0.9),
      type: 'physical',
      iconName: 'Zap',
    });
  }

  if (stats.defense >= 45) {
    moves.push({
      name: 'Shield Bash',
      description: 'Use your defensive prowess to deal damage.',
      power: Math.floor(12 + stats.defense * 1.0),
      type: 'physical',
      iconName: 'Shield',
    });
  }

  // NFT type-based special moves
  const typeMove = getTypeMove(stats.nftType, stats);
  if (typeMove) {
    moves.push(typeMove);
  }

  // Ensure we have exactly 4 moves
  const fillMoves = [
    {
      name: 'Focus',
      description: 'Concentrate energy for the next attack.',
      power: Math.floor(10 + stats.strength * 0.5),
      type: 'support',
      iconName: 'Star',
    },
    {
      name: 'Defend',
      description: 'Raise your guard to reduce incoming damage.',
      power: Math.floor(8 + stats.defense * 0.4),
      type: 'support',
      iconName: 'Shield',
    },
    {
      name: 'Quick Attack',
      description: 'A swift strike that uses speed.',
      power: Math.floor(12 + stats.speed * 0.6),
      type: 'physical',
      iconName: 'Zap',
    },
  ];

  let fillIndex = 0;
  while (moves.length < 4 && fillIndex < fillMoves.length) {
    moves.push(fillMoves[fillIndex]);
    fillIndex++;
  }

  return moves.slice(0, 4);
}

function getTypeMove(nftType: number, stats: NFTStats): BattleMove | null {
  switch (nftType) {
    case 0: // Fire
      return {
        name: 'Flame Burst',
        description: 'A powerful fire attack that burns with intensity.',
        power: Math.floor(25 + stats.strength * 1.1),
        type: 'fire',
        iconName: 'Flame',
      };
    case 1: // Water
      return {
        name: 'Hydro Pump',
        description: 'A forceful water attack that overwhelms foes.',
        power: Math.floor(22 + stats.intelligence * 1.0),
        type: 'water',
        iconName: 'Water',
      };
    case 2: // Grass
      return {
        name: "Nature's Wrath",
        description: 'Channel the power of nature in this devastating attack.',
        power: Math.floor(20 + stats.defense * 0.8 + stats.intelligence * 0.4),
        type: 'grass',
        iconName: 'Grass',
      };
    default:
      return null;
  }
}
