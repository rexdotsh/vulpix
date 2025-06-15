export interface BattleMove {
  name: string;
  description: string;
  power: number;
  type: string;
  iconName: string;
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

// Generate moves based on NFT stats
export function generateMoves(stats: NFTStats): BattleMove[] {
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
