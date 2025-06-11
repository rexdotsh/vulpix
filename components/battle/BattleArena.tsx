import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { getPlayerDisplayName } from '@/lib/battle-utils';

interface PlayerArenaData {
  address: string;
  name?: string;
  health: number;
  maxHealth: number;
}

interface BattleArenaProps {
  player1: PlayerArenaData;
  player2: PlayerArenaData;
  player1Image?: string;
  player2Image?: string;
  player1NFTName: string;
  player2NFTName: string;
  player1NFTType: number;
  player2NFTType: number;
  turnNumber: number;
}

export function BattleArena({
  player1,
  player2,
  player1Image,
  player2Image,
  player1NFTName,
  player2NFTName,
  player1NFTType,
  player2NFTType,
  turnNumber,
}: BattleArenaProps) {
  const getTypeEmoji = (nftType: number) => {
    return nftType === 0 ? '🔥' : nftType === 1 ? '💧' : '🌿';
  };

  return (
    <Card className="flex-1 m-6 mr-0 rounded-2xl overflow-hidden relative">
      {/* NFT Images */}
      <div className="flex h-full">
        {/* Player 1 NFT */}
        <div className="flex-1 relative">
          {player1Image ? (
            <Image
              src={player1Image}
              alt="Player NFT"
              fill
              className="object-cover"
              style={{
                maskImage:
                  'radial-gradient(ellipse 70% 100% at center, black 40%, transparent 70%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 70% 100% at center, black 40%, transparent 70%)',
              }}
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-9xl opacity-60">
              {getTypeEmoji(player1NFTType)}
            </div>
          )}
        </div>

        {/* VS Section */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="bg-black/50 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center space-y-4">
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">{player1NFTName}</p>
                <h1 className="text-6xl font-bold text-white tracking-wider">
                  VS
                </h1>
                <p className="text-lg font-bold text-white">{player2NFTName}</p>
              </div>
              <div className="text-sm text-white/80">Turn {turnNumber}</div>
            </CardContent>
          </Card>
        </div>

        {/* Player 2 NFT */}
        <div className="flex-1 relative">
          {player2Image ? (
            <Image
              src={player2Image}
              alt="Opponent NFT"
              fill
              className="object-cover"
              style={{
                maskImage:
                  'radial-gradient(ellipse 70% 100% at center, black 40%, transparent 70%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 70% 100% at center, black 40%, transparent 70%)',
              }}
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-9xl opacity-60">
              {getTypeEmoji(player2NFTType)}
            </div>
          )}
        </div>
      </div>

      {/* Health Bars */}
      <div className="absolute bottom-16 left-12 right-12">
        <div className="flex justify-between items-center">
          {/* Player 1 Health */}
          <div className="space-y-2">
            <p className="text-lg font-medium text-white">
              {getPlayerDisplayName(player1.address, player1.name)}
            </p>
            <p className="text-lg font-medium text-white flex items-center gap-2">
              <Heart className="size-4 text-red-500" />
              {player1.health}/{player1.maxHealth}
            </p>
            <div className="w-40">
              <Progress
                value={(player1.health / player1.maxHealth) * 100}
                className="h-6 bg-white/20"
              />
            </div>
          </div>

          {/* Player 2 Health */}
          <div className="space-y-2 text-right">
            <p className="text-lg font-medium text-white">
              {getPlayerDisplayName(player2.address, player2.name)}
            </p>
            <p className="text-lg font-medium text-white flex items-center gap-2 justify-end">
              <Heart className="size-4 text-red-500" />
              {player2.health}/{player2.maxHealth}
            </p>
            <div className="w-40 ml-auto">
              <Progress
                value={(player2.health / player2.maxHealth) * 100}
                className="h-6 bg-white/20"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
