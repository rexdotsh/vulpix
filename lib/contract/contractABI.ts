export const VulpixPVMABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'battleId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'player1',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'player2',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'player1InitialHealth',
        type: 'uint128',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'player2InitialHealth',
        type: 'uint128',
      },
    ],
    name: 'BattleCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'battleId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'winner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'totalTurns',
        type: 'uint32',
      },
    ],
    name: 'BattleEnded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'battleId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'turnNumber',
        type: 'uint32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'attacker',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'damageDealt',
        type: 'uint128',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'wasCriticalHit',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'defenderNewHealth',
        type: 'uint128',
      },
    ],
    name: 'TurnExecuted',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'battleMoves',
    outputs: [
      { internalType: 'uint32', name: 'turnNumber', type: 'uint32' },
      { internalType: 'address', name: 'attacker', type: 'address' },
      { internalType: 'uint128', name: 'damageDealt', type: 'uint128' },
      { internalType: 'bool', name: 'wasCriticalHit', type: 'bool' },
      { internalType: 'uint128', name: 'defenderHealthAfter', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'battles',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'address', name: 'player1', type: 'address' },
      { internalType: 'address', name: 'player2', type: 'address' },
      {
        components: [
          { internalType: 'uint128', name: 'attack', type: 'uint128' },
          { internalType: 'uint128', name: 'defense', type: 'uint128' },
          { internalType: 'uint128', name: 'intelligence', type: 'uint128' },
          { internalType: 'uint128', name: 'luck', type: 'uint128' },
          { internalType: 'uint128', name: 'speed', type: 'uint128' },
          { internalType: 'uint128', name: 'strength', type: 'uint128' },
          {
            internalType: 'enum VulpixPVM.NFTType',
            name: 'nftType',
            type: 'uint8',
          },
        ],
        internalType: 'struct VulpixPVM.NFT',
        name: 'player1NFT',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint128', name: 'attack', type: 'uint128' },
          { internalType: 'uint128', name: 'defense', type: 'uint128' },
          { internalType: 'uint128', name: 'intelligence', type: 'uint128' },
          { internalType: 'uint128', name: 'luck', type: 'uint128' },
          { internalType: 'uint128', name: 'speed', type: 'uint128' },
          { internalType: 'uint128', name: 'strength', type: 'uint128' },
          {
            internalType: 'enum VulpixPVM.NFTType',
            name: 'nftType',
            type: 'uint8',
          },
        ],
        internalType: 'struct VulpixPVM.NFT',
        name: 'player2NFT',
        type: 'tuple',
      },
      {
        internalType: 'uint128',
        name: 'player1CurrentHealth',
        type: 'uint128',
      },
      {
        internalType: 'uint128',
        name: 'player2CurrentHealth',
        type: 'uint128',
      },
      { internalType: 'uint128', name: 'player1MaxHealth', type: 'uint128' },
      { internalType: 'uint128', name: 'player2MaxHealth', type: 'uint128' },
      { internalType: 'address', name: 'currentPlayerTurn', type: 'address' },
      { internalType: 'bool', name: 'isOver', type: 'bool' },
      { internalType: 'address', name: 'winner', type: 'address' },
      { internalType: 'uint32', name: 'turnCount', type: 'uint32' },
      { internalType: 'uint32', name: 'creationTimestamp', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_player2', type: 'address' },
      {
        components: [
          { internalType: 'uint128', name: 'attack', type: 'uint128' },
          { internalType: 'uint128', name: 'defense', type: 'uint128' },
          { internalType: 'uint128', name: 'intelligence', type: 'uint128' },
          { internalType: 'uint128', name: 'luck', type: 'uint128' },
          { internalType: 'uint128', name: 'speed', type: 'uint128' },
          { internalType: 'uint128', name: 'strength', type: 'uint128' },
          {
            internalType: 'enum VulpixPVM.NFTType',
            name: 'nftType',
            type: 'uint8',
          },
        ],
        internalType: 'struct VulpixPVM.NFT',
        name: '_player1NFT',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint128', name: 'attack', type: 'uint128' },
          { internalType: 'uint128', name: 'defense', type: 'uint128' },
          { internalType: 'uint128', name: 'intelligence', type: 'uint128' },
          { internalType: 'uint128', name: 'luck', type: 'uint128' },
          { internalType: 'uint128', name: 'speed', type: 'uint128' },
          { internalType: 'uint128', name: 'strength', type: 'uint128' },
          {
            internalType: 'enum VulpixPVM.NFTType',
            name: 'nftType',
            type: 'uint8',
          },
        ],
        internalType: 'struct VulpixPVM.NFT',
        name: '_player2NFT',
        type: 'tuple',
      },
      {
        internalType: 'uint128',
        name: '_player1InitialHealth',
        type: 'uint128',
      },
      {
        internalType: 'uint128',
        name: '_player2InitialHealth',
        type: 'uint128',
      },
    ],
    name: 'createBattle',
    outputs: [{ internalType: 'uint256', name: 'battleId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_battleId', type: 'uint256' }],
    name: 'executeTurn',
    outputs: [
      { internalType: 'uint128', name: 'P1Health', type: 'uint128' },
      { internalType: 'uint128', name: 'P2Health', type: 'uint128' },
      { internalType: 'bool', name: 'IsOver', type: 'bool' },
      { internalType: 'address', name: 'WinnerAddress', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_battleId', type: 'uint256' }],
    name: 'getBattleMoves',
    outputs: [
      {
        components: [
          { internalType: 'uint32', name: 'turnNumber', type: 'uint32' },
          { internalType: 'address', name: 'attacker', type: 'address' },
          { internalType: 'uint128', name: 'damageDealt', type: 'uint128' },
          { internalType: 'bool', name: 'wasCriticalHit', type: 'bool' },
          {
            internalType: 'uint128',
            name: 'defenderHealthAfter',
            type: 'uint128',
          },
        ],
        internalType: 'struct VulpixPVM.Move[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_battleId', type: 'uint256' }],
    name: 'getBattleState',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'player1', type: 'address' },
          { internalType: 'address', name: 'player2', type: 'address' },
          {
            components: [
              { internalType: 'uint128', name: 'attack', type: 'uint128' },
              { internalType: 'uint128', name: 'defense', type: 'uint128' },
              {
                internalType: 'uint128',
                name: 'intelligence',
                type: 'uint128',
              },
              { internalType: 'uint128', name: 'luck', type: 'uint128' },
              { internalType: 'uint128', name: 'speed', type: 'uint128' },
              { internalType: 'uint128', name: 'strength', type: 'uint128' },
              {
                internalType: 'enum VulpixPVM.NFTType',
                name: 'nftType',
                type: 'uint8',
              },
            ],
            internalType: 'struct VulpixPVM.NFT',
            name: 'player1NFT',
            type: 'tuple',
          },
          {
            components: [
              { internalType: 'uint128', name: 'attack', type: 'uint128' },
              { internalType: 'uint128', name: 'defense', type: 'uint128' },
              {
                internalType: 'uint128',
                name: 'intelligence',
                type: 'uint128',
              },
              { internalType: 'uint128', name: 'luck', type: 'uint128' },
              { internalType: 'uint128', name: 'speed', type: 'uint128' },
              { internalType: 'uint128', name: 'strength', type: 'uint128' },
              {
                internalType: 'enum VulpixPVM.NFTType',
                name: 'nftType',
                type: 'uint8',
              },
            ],
            internalType: 'struct VulpixPVM.NFT',
            name: 'player2NFT',
            type: 'tuple',
          },
          {
            internalType: 'uint128',
            name: 'player1CurrentHealth',
            type: 'uint128',
          },
          {
            internalType: 'uint128',
            name: 'player2CurrentHealth',
            type: 'uint128',
          },
          {
            internalType: 'uint128',
            name: 'player1MaxHealth',
            type: 'uint128',
          },
          {
            internalType: 'uint128',
            name: 'player2MaxHealth',
            type: 'uint128',
          },
          {
            internalType: 'address',
            name: 'currentPlayerTurn',
            type: 'address',
          },
          { internalType: 'bool', name: 'isOver', type: 'bool' },
          { internalType: 'address', name: 'winner', type: 'address' },
          { internalType: 'uint32', name: 'turnCount', type: 'uint32' },
          { internalType: 'uint32', name: 'creationTimestamp', type: 'uint32' },
        ],
        internalType: 'struct VulpixPVM.Battle',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_battleId', type: 'uint256' },
      { internalType: 'address', name: '_playerAddress', type: 'address' },
    ],
    name: 'getPlayerHealthPercentage',
    outputs: [{ internalType: 'uint256', name: 'percentage', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_battleId', type: 'uint256' }],
    name: 'isBattleOver',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextBattleId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
