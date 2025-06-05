// Battle frontend utilities

export const CONTRACT_ADDRESS = '0x6761CD4db5D747562bf6DACA6eC92ed277Af4F98';

export const NFT_TYPE_NAMES = ['Fire', 'Water', 'Grass'];

export const NFT_TYPE_COLORS = {
  0: 'bg-red-500 text-white',
  1: 'bg-blue-500 text-white',
  2: 'bg-green-500 text-white',
};

export function getPlayerDisplayName(address: string, name?: string): string {
  return name || `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getHealthPercentage(current: number, max: number): number {
  return Math.max(0, Math.min(100, (current / max) * 100));
}

export function getHealthColor(percentage: number): string {
  if (percentage > 50) return '#22c55e';
  if (percentage > 25) return '#eab308';
  return '#ef4444';
}

export function getNFTTypeName(nftType: number): string {
  return NFT_TYPE_NAMES[nftType] || 'Unknown';
}

export function getNFTTypeColor(nftType: number): string {
  return (
    NFT_TYPE_COLORS[nftType as keyof typeof NFT_TYPE_COLORS] ||
    'bg-gray-500 text-white'
  );
}

export function formatTimeLeft(expiresAt: number): string {
  const timeLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
  return `${timeLeft}m left`;
}

export function getBattleStatusColor(status: string): string {
  switch (status) {
    case 'waiting':
      return 'bg-yellow-500';
    case 'ready':
      return 'bg-green-500';
    case 'active':
      return 'bg-blue-500';
    case 'finished':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

export function isPlayerTurn(battle: any, playerAddress: string): boolean {
  return battle?.gameState?.currentTurn === playerAddress;
}

export function getOpponentInfo(battle: any, currentPlayerAddress: string) {
  const isPlayer1 = battle.player1Address === currentPlayerAddress;
  return {
    address: isPlayer1 ? battle.player2Address : battle.player1Address,
    name: isPlayer1 ? battle.player2Name : battle.player1Name,
    nft: isPlayer1 ? battle.player2NFT : battle.player1NFT,
    health: isPlayer1
      ? battle.gameState.player2Health
      : battle.gameState.player1Health,
    maxHealth: isPlayer1
      ? battle.gameState.player2MaxHealth
      : battle.gameState.player1MaxHealth,
  };
}

export function getCurrentPlayerInfo(
  battle: any,
  currentPlayerAddress: string,
) {
  const isPlayer1 = battle.player1Address === currentPlayerAddress;
  return {
    address: isPlayer1 ? battle.player1Address : battle.player2Address,
    name: isPlayer1 ? battle.player1Name : battle.player2Name,
    nft: isPlayer1 ? battle.player1NFT : battle.player2NFT,
    health: isPlayer1
      ? battle.gameState.player1Health
      : battle.gameState.player2Health,
    maxHealth: isPlayer1
      ? battle.gameState.player1MaxHealth
      : battle.gameState.player2MaxHealth,
  };
}
