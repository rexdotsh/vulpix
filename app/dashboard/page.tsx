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

const decodeHexMetadata = (hexString: string) => {
  try {
    if (!hexString || hexString === '0x') return null;
    const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [],
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

const getIpfsImageUrl = (metadata: any) => {
  if (!metadata?.image) return null;
  const { image } = metadata;
  if (image.startsWith('ipfs://')) {
    return `https://gateway.pinata.cloud/ipfs/${image.replace('ipfs://', '')}`;
  }
  if (typeof image === 'string' && image.length > 40) {
    return `https://gateway.pinata.cloud/ipfs/${image}`;
  }
  return image;
};

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
  const { isReady, selectedAccount } = usePolkadot();
  const { isInitialized } = useAssetHub();
  const [burningItem, setBurningItem] = useState<string | null>(null);

  const {
    nfts: userNFTs,
    lastSyncTime,
    isSyncing,
    syncFromAssetHub,
    burnNFT,
    initializeUser,
  } = useNFTs();

  useEffect(() => {
    if (isReady && selectedAccount) {
      initializeUser();
    }
  }, [isReady, selectedAccount]);

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
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => syncFromAssetHub()}
              disabled={isSyncing || !isInitialized}
            >
              {isSyncing ? 'Syncing...' : 'Sync from AssetHub'}
            </Button>
            <Badge variant="secondary" className="text-sm">
              {selectedAccount?.meta.name ||
                selectedAccount?.address.slice(0, 8)}
            </Badge>
          </div>
        </div>

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
                  <CardFooter>
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
