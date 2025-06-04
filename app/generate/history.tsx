'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { mintImageAsNFT, getUserCollections } from '@/lib/mintNFT';
import type { UserCollection } from '@/lib/assetHubNFTManager';

type ImageGeneration = {
  _id: string;
  prompt: string;
  model: string;
  status: 'pending' | 'completed' | 'failed';
  imageUrl?: string;
  createdAt: number;
  width?: number;
  height?: number;
};

export function ImageHistory() {
  const { selectedAccount } = usePolkadot();
  const userAddress = selectedAccount?.address;

  const images = useQuery(
    api.functions.images.getUserImages,
    userAddress ? { userAddress } : 'skip',
  );

  if (!userAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Connect your wallet to view your image history
        </p>
      </div>
    );
  }

  if (!images) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={`skeleton-${i}-${userAddress || 'guest'}`}
            className="overflow-hidden"
          >
            <CardHeader className="p-4">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="p-0">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
            <CardFooter className="p-4">
              <Skeleton className="h-4 w-1/3" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No images generated yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <ImageHistoryCard
          key={image._id}
          image={image as unknown as ImageGeneration}
        />
      ))}
    </div>
  );
}

function ImageHistoryCard({ image }: { image: ImageGeneration }) {
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const { nftManager, isInitialized: isAssetHubInitialized } = useAssetHub();
  const { selectedAccount } = usePolkadot();
  const [collectionsList, setCollectionsList] = useState<UserCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  useEffect(() => {
    if (isAssetHubInitialized && selectedAccount?.address && nftManager) {
      setIsLoadingCollections(true);
      (async () => {
        const cols = await getUserCollections(
          nftManager,
          selectedAccount.address,
        );
        setCollectionsList(cols);
        setIsLoadingCollections(false);
      })();
    }
  }, [isAssetHubInitialized, selectedAccount?.address, nftManager]);

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <CardHeader className="p-4">
          <CardTitle className="text-sm truncate">{image.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          {image.status === 'completed' && image.imageUrl ? (
            <div className="relative h-[200px] w-full">
              <Image
                src={image.imageUrl}
                alt={image.prompt}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : image.status === 'pending' ? (
            <div className="flex items-center justify-center h-[200px] bg-muted/50">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-8 w-8 mb-2 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-muted-foreground">
                  Processing...
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] bg-muted/50">
              <span className="text-muted-foreground">Failed to generate</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{image.model}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(image.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            {image.status === 'completed' && image.imageUrl && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={image.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMintDialogOpen(true)}
                  disabled={!isAssetHubInitialized}
                >
                  Mint NFT
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {image.status === 'completed' && image.imageUrl && (
        <MintDialog
          open={mintDialogOpen}
          setOpen={setMintDialogOpen}
          imageUrl={image.imageUrl}
          nftManager={nftManager}
          isAssetHubInitialized={isAssetHubInitialized}
          collections={collectionsList}
          isLoadingCollections={isLoadingCollections}
        />
      )}
    </>
  );
}

function MintDialog({
  open,
  setOpen,
  imageUrl,
  nftManager,
  isAssetHubInitialized,
  collections,
  isLoadingCollections,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  imageUrl: string;
  nftManager: any;
  isAssetHubInitialized: boolean;
  collections: UserCollection[];
  isLoadingCollections: boolean;
}) {
  const { selectedAccount, getInjector } = usePolkadot();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    if (!selectedAccount) return;

    setIsMinting(true);
    const result = await mintImageAsNFT({
      nftManager,
      selectedAccount,
      getInjector,
      selectedCollectionId,
      newCollectionName,
      imageUrl,
    });

    setIsMinting(false);
    if (result) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mint as NFT</DialogTitle>
          <DialogDescription>
            Mint this image as an NFT on AssetHub
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative h-[200px] w-full mb-4">
            <Image
              src={imageUrl}
              alt="Image to mint"
              fill
              className="object-contain rounded-md"
              unoptimized
            />
          </div>

          {isLoadingCollections ? (
            <p className="text-sm text-muted-foreground text-center">
              Loading collections...
            </p>
          ) : collections.length > 0 ? (
            <Select
              onValueChange={setSelectedCollectionId}
              value={selectedCollectionId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.metadata?.name || col.id}
                  </SelectItem>
                ))}
                <SelectItem value="new">Create new collection</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No collections found. Please enter a new collection name below.
            </p>
          )}

          {(selectedCollectionId === 'new' ||
            (!isLoadingCollections && collections.length === 0)) && (
            <Input
              placeholder="New Collection Name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMint}
            disabled={
              isMinting ||
              isLoadingCollections ||
              (!selectedCollectionId && !newCollectionName.trim()) ||
              !isAssetHubInitialized
            }
          >
            {isMinting ? 'Minting...' : 'Mint NFT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
