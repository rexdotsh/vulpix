import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Shield, Zap, Brain, Star, User } from 'lucide-react';
import {
  getPlayerDisplayName,
  getNFTTypeName,
  getNFTTypeColor,
} from '@/lib/battle-utils';
import type { NFTStats } from '@/lib/battle-moves';

interface PlayerData {
  address: string;
  name?: string;
  nft: {
    item: string;
    collection: string;
    stats: NFTStats;
  };
  profile?: {
    profilePicture?: string;
  } | null;
}

interface BattlePlayerPanelProps {
  player: PlayerData;
  nftName: string;
  isMyTurn: boolean;
}

export function BattlePlayerPanel({
  player,
  nftName,
  isMyTurn,
}: BattlePlayerPanelProps) {
  const isProfileLoading = player.profile === undefined;

  return (
    <Card className="w-96 rounded-none border-r border-l-0 border-t-0 border-b-0">
      <CardContent className="p-6 space-y-6">
        {/* Username and Status */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`size-2 rounded-full ${
                isMyTurn ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {isMyTurn ? 'Your Turn' : 'Waiting...'}
            </span>
          </div>
          <h2 className="text-lg font-medium">
            {getPlayerDisplayName(player.address, player.name)}
          </h2>
        </div>

        {/* Profile Picture */}
        <div className="flex justify-center">
          {isProfileLoading ? (
            <Skeleton className="size-32 rounded-full" />
          ) : (
            <Avatar className="size-32">
              <AvatarImage
                src={player.profile?.profilePicture}
                alt="Profile Picture"
              />
              <AvatarFallback className="size-32 text-4xl">
                <User className="size-16" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* NFT Type Badge */}
        <div className="flex justify-center">
          <Badge
            className={`${getNFTTypeColor(player.nft.stats.nftType)} text-sm px-4 py-1`}
          >
            {getNFTTypeName(player.nft.stats.nftType)}
          </Badge>
        </div>

        <Separator />

        {/* NFT Details */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">NFT Details</h3>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-primary">Name:</span>
              <span className="ml-2">{nftName}</span>
            </div>
            <div>
              <span className="text-primary">ID:</span>
              <span className="ml-2">{player.nft.item}</span>
            </div>
            <div>
              <span className="text-primary">Collection:</span>
              <span className="ml-2">
                {player.nft.collection.slice(0, 8)}...
              </span>
            </div>
            <div>
              <span className="text-primary">Max Health:</span>
              <span className="ml-2">{player.nft.stats.maxHealth}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Battle Stats */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Battle Stats</h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Swords className="size-3" />
                Attack:
              </span>
              <span>{player.nft.stats.attack}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Shield className="size-3" />
                Defense:
              </span>
              <span>{player.nft.stats.defense}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Zap className="size-3 text-blue-500" />
                Speed:
              </span>
              <span>{player.nft.stats.speed}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <span className="size-3 text-red-500">💪</span>
                Strength:
              </span>
              <span>{player.nft.stats.strength}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Brain className="size-3 text-purple-500" />
                Intelligence:
              </span>
              <span>{player.nft.stats.intelligence}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Star className="size-3 text-yellow-500" />
                Luck:
              </span>
              <span>{player.nft.stats.luck}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Collection Info */}
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Vulpix Battle Arena
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
