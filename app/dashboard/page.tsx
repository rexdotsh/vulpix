'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { useNFTs } from '@/hooks/useNFTs';
import { PageStateCard } from '@/components/battle/PageStateCard';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { decodeHexMetadata, getIpfsImageUrl } from '@/lib/utils';
import { Swords } from 'lucide-react';

function NFTLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Skeleton className="aspect-square w-full rounded-t-xl" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const {
    isReady,
    selectedAccount,
    isInitialized: isPolkadotInitialized,
  } = usePolkadot();
  const { isInitialized } = useAssetHub();
  const [burningItem, setBurningItem] = useState<string | null>(null);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);

  const {
    nfts: userNFTs,
    lastSyncTime,
    isSyncing,
    syncFromAssetHub,
    burnNFT,
    initializeUser,
  } = useNFTs();

  const activeBattles = useQuery(
    api.battle.getUserActiveBattles,
    selectedAccount ? { userAddress: selectedAccount.address } : 'skip',
  );

  useEffect(() => {
    if (isReady && selectedAccount) {
      initializeUser();

      // start background sync when component loads
      const performBackgroundSync = async () => {
        if (isInitialized && !isSyncing) {
          setIsBackgroundSyncing(true);
          try {
            await syncFromAssetHub();
          } finally {
            setIsBackgroundSyncing(false);
          }
        }
      };

      performBackgroundSync();
    }
  }, [isReady, selectedAccount, isInitialized]);

  if (!isPolkadotInitialized) {
    return (
      <PageStateCard
        variant="loading"
        message="Initializing wallet connection..."
      />
    );
  }

  if (!isReady) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Wallet Not Connected</CardTitle>
            <CardDescription>
              Please connect your wallet to view your NFTs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Connect Wallet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = userNFTs === undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-xl font-bold text-foreground hover:text-foreground/80"
            >
              AssetHub NFT Manager
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My NFTs</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading
                ? 'Loading...'
                : `${userNFTs?.length || 0} items found`}
              {lastSyncTime && (
                <span className="ml-2 text-sm">
                  (Last synced:{' '}
                  {formatDistanceToNow(lastSyncTime, { addSuffix: true })})
                </span>
              )}
              {isBackgroundSyncing && (
                <span className="ml-2 text-sm text-muted-foreground animate-pulse">
                  (Syncing in background...)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild variant="default">
              <Link href="/battle">
                <Swords className="h-4 w-4 mr-2" />
                Battle Arena
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => syncFromAssetHub()}
              disabled={isSyncing || isBackgroundSyncing || !isInitialized}
            >
              {isSyncing || isBackgroundSyncing
                ? 'Syncing...'
                : 'Sync from AssetHub'}
            </Button>
            <Badge variant="secondary" className="text-sm">
              {selectedAccount?.meta.name ||
                selectedAccount?.address.slice(0, 8)}
            </Badge>
          </div>
        </div>

        {activeBattles && activeBattles.length > 0 && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <Swords className="h-5 w-5" />
                Active Battles ({activeBattles.length})
              </CardTitle>
              <CardDescription>
                You have ongoing battles that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeBattles.slice(0, 3).map((battle) => {
                  const isMyTurn =
                    battle.gameState.currentTurn === selectedAccount?.address;
                  const opponent =
                    battle.player1Address === selectedAccount?.address
                      ? battle.player2Name || battle.player2Address.slice(0, 8)
                      : battle.player1Name || battle.player1Address.slice(0, 8);

                  return (
                    <div
                      key={battle._id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isMyTurn
                              ? 'bg-green-500 animate-pulse'
                              : 'bg-yellow-500'
                          }`}
                        />
                        <div>
                          <p className="font-medium">vs {opponent}</p>
                          <p className="text-sm text-muted-foreground">
                            {isMyTurn ? 'Your turn' : 'Waiting for opponent'} •
                            Turn {battle.gameState.turnNumber}
                          </p>
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/battle/play/${battle.battleId}`}>
                          {isMyTurn ? 'Play Turn' : 'View Battle'}
                        </Link>
                      </Button>
                    </div>
                  );
                })}
                {activeBattles.length > 3 && (
                  <Button asChild variant="outline" className="w-full mt-2">
                    <Link href="/battle">
                      View All Battles ({activeBattles.length})
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <NFTLoadingSkeleton key={`skeleton-${Date.now()}-${i}`} />
            ))}
          </div>
        ) : userNFTs && userNFTs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userNFTs.map((nft) => {
              const metadata = decodeHexMetadata(nft.itemMetadata?.data);
              const imageUrl = getIpfsImageUrl(metadata);

              return (
                <Card
                  key={`${nft.collection}-${nft.item}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-0">
                    {imageUrl && (
                      <div className="aspect-square bg-muted">
                        <img
                          src={imageUrl}
                          alt={metadata?.name || `NFT ${nft.item}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <CardTitle className="text-lg mb-2">
                        {metadata?.name || `Item #${nft.item}`}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Collection: {nft.collection}</p>
                        <p>Item: {nft.item}</p>
                      </div>
                      {metadata?.description && (
                        <CardDescription className="mt-3 line-clamp-3">
                          {metadata.description}
                        </CardDescription>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        const id = `${nft.collection}-${nft.item}`;
                        setBurningItem(id);
                        try {
                          await burnNFT(nft.collection, nft.item);
                        } catch (error) {
                          console.error(error);
                        } finally {
                          setBurningItem(null);
                        }
                      }}
                      disabled={
                        burningItem === `${nft.collection}-${nft.item}` ||
                        !isInitialized
                      }
                    >
                      {burningItem === `${nft.collection}-${nft.item}`
                        ? 'Burning...'
                        : 'Burn'}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href="/battle">
                        <Swords className="h-4 w-4 mr-1" />
                        Battle
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl mb-2">No NFTs Found</CardTitle>
              <CardDescription>
                This account doesn't have any NFTs on AssetHub yet.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
