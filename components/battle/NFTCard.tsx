import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { NFTStatsDisplay } from './NFTStatsDisplay';
import { decodeHexMetadata, getIpfsImageUrl } from '@/lib/utils';
import {
  getPlayerDisplayName,
  getHealthPercentage,
  getNFTTypeName,
  getNFTTypeColor,
} from '@/lib/battle-utils';

interface NFTCardProps {
  title: string;
  playerAddress: string;
  playerName?: string;
  nftData: {
    collection: string;
    item: string;
    itemMetadata?: { data: string };
  };
  stats: {
    attack: number;
    defense: number;
    intelligence: number;
    luck: number;
    speed: number;
    strength: number;
    nftType: number;
    maxHealth: number;
  };
  currentHealth: number;
  maxHealth: number;
  isCurrentPlayer?: boolean;
  isCurrentTurn?: boolean;
  showFullStats?: boolean;
}

export function NFTCard({
  title,
  playerAddress,
  playerName,
  nftData,
  stats,
  currentHealth,
  maxHealth,
  isCurrentPlayer = false,
  isCurrentTurn = false,
  showFullStats = true,
}: NFTCardProps) {
  const metadata = decodeHexMetadata(nftData.itemMetadata?.data || '');
  const imageUrl = getIpfsImageUrl(metadata);
  const healthPercentage = getHealthPercentage(currentHealth, maxHealth);
  const typeName = getNFTTypeName(stats.nftType);
  const typeColor = getNFTTypeColor(stats.nftType);
  const displayName = getPlayerDisplayName(playerAddress, playerName);

  return (
    <Card
      className={`w-full max-w-md ${
        isCurrentPlayer ? 'ring-2 ring-blue-500' : ''
      } ${isCurrentTurn ? 'ring-2 ring-yellow-500' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={typeColor}>{typeName}</Badge>
            {isCurrentTurn && (
              <Badge variant="default" className="animate-pulse">
                Turn
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {displayName}
          {isCurrentPlayer && <span className="text-blue-500"> (You)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NFT Image */}
        {imageUrl && (
          <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={metadata?.name || 'NFT'}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* NFT Info */}
        <div className="space-y-2">
          <h4 className="font-semibold">{metadata?.name || 'Unknown NFT'}</h4>
          <p className="text-sm text-muted-foreground">
            Collection: {nftData.collection.slice(0, 8)}...
          </p>
          <p className="text-sm text-muted-foreground">
            Item: {nftData.item.slice(0, 8)}...
          </p>
        </div>

        {/* Health Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Health</span>
            <span className="font-medium">
              {currentHealth}/{maxHealth}
            </span>
          </div>
          <Progress
            value={healthPercentage}
            className="h-3"
            style={
              {
                '--progress-background':
                  healthPercentage > 50
                    ? '#22c55e'
                    : healthPercentage > 25
                      ? '#eab308'
                      : '#ef4444',
              } as React.CSSProperties
            }
          />
        </div>

        {showFullStats && (
          <>
            <Separator />
            <div>
              <h5 className="font-medium text-sm mb-2">Battle Stats</h5>
              <NFTStatsDisplay stats={stats} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
