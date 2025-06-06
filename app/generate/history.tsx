'use client';

import { useState, useEffect, useMemo } from 'react';
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

type ImageGen = {
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
  const [searchDate, setSearchDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const images = useQuery(
    api.images.getUserImages,
    userAddress ? { userAddress } : 'skip',
  );

  const filteredImages = useMemo(() => {
    if (!images) return [];

    let filtered = images;

    if (searchDate) {
      const date = new Date(searchDate);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      filtered = images.filter((img) => {
        const imgDate = new Date(img.createdAt);
        return imgDate >= start && imgDate <= end;
      });
    }

    return [...filtered].sort((a, b) =>
      sortOrder === 'newest'
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt,
    );
  }, [images, searchDate, sortOrder]);

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
      <div className="w-full max-w-[1800px] mx-auto px-4">
        <div className="flex flex-wrap justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-full sm:w-1/2 lg:w-1/3 p-8 flex justify-center"
            >
              <Card className="overflow-hidden w-[512px] h-[512px]">
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="p-0 flex-grow">
                  <Skeleton className="w-full h-full" />
                </CardContent>
                <CardFooter className="p-4">
                  <Skeleton className="h-4 w-1/3" />
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredImages.length === 0 && images?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No images generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative flex justify-center">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Search by date:</span>
            <Input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort:</span>
            <Select
              value={sortOrder}
              onValueChange={(value: 'newest' | 'oldest') =>
                setSortOrder(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(searchDate || sortOrder !== 'newest') && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchDate('');
              setSortOrder('newest');
            }}
            className="text-sm absolute left-[calc(50%+16rem)] top-1/2 -translate-y-1/2"
          >
            Clear filters
          </Button>
        )}
      </div>

      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">
            No images found for the selected date
          </p>
        </div>
      ) : (
        <div className="w-full max-w-[1800px] mx-auto px-4">
          <div className="flex flex-wrap justify-center">
            {filteredImages.map((image) => (
              <div
                key={image._id}
                className="w-full sm:w-1/2 lg:w-1/3 p-8 flex justify-center"
              >
                <ImageCard image={image as unknown as ImageGen} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageCard({ image }: { image: ImageGen }) {
  const [mintOpen, setMintOpen] = useState(false);
  const { nftManager, isInitialized } = useAssetHub();
  const { selectedAccount } = usePolkadot();
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isInitialized && selectedAccount?.address && nftManager) {
      setLoading(true);
      getUserCollections(nftManager, selectedAccount.address)
        .then(setCollections)
        .finally(() => setLoading(false));
    }
  }, [isInitialized, selectedAccount?.address, nftManager]);

  return (
    <>
      <Card className="overflow-hidden flex flex-col w-[512px] h-[512px]">
        <CardHeader className="p-4">
          <CardTitle className="text-sm truncate">{image.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          {image.status === 'completed' && image.imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={image.imageUrl}
                alt={image.prompt}
                width={1024}
                height={1024}
                className="object-contain w-full h-full"
                unoptimized
              />
            </div>
          ) : image.status === 'pending' ? (
            <div className="flex items-center justify-center w-full h-full bg-muted/50">
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
            <div className="flex items-center justify-center w-full h-full bg-muted/50">
              <span className="text-muted-foreground">Failed to generate</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {new Date(image.createdAt).toLocaleDateString()}
          </span>
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
                  onClick={() => setMintOpen(true)}
                  disabled={!isInitialized}
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
          open={mintOpen}
          setOpen={setMintOpen}
          imageUrl={image.imageUrl}
          nftManager={nftManager}
          isInitialized={isInitialized}
          collections={collections}
          loading={loading}
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
  isInitialized,
  collections,
  loading,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  imageUrl: string;
  nftManager: any;
  isInitialized: boolean;
  collections: UserCollection[];
  loading: boolean;
}) {
  const { selectedAccount, getInjector } = usePolkadot();
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [minting, setMinting] = useState(false);

  const handleMint = async () => {
    if (!selectedAccount) return;

    setMinting(true);
    const result = await mintImageAsNFT({
      nftManager,
      selectedAccount,
      getInjector,
      selectedCollectionId: selectedCollection,
      newCollectionName,
      imageUrl,
    });

    setMinting(false);
    if (result) setOpen(false);
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
          <div className="relative w-[512px] h-[512px] mb-4 mx-auto">
            <Image
              src={imageUrl}
              alt="Image to mint"
              width={1024}
              height={1024}
              className="object-contain w-full h-full rounded-md"
              unoptimized
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center">
              Loading collections...
            </p>
          ) : collections.length > 0 ? (
            <Select
              onValueChange={setSelectedCollection}
              value={selectedCollection}
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

          {(selectedCollection === 'new' ||
            (!loading && collections.length === 0)) && (
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
              minting ||
              loading ||
              (!selectedCollection && !newCollectionName.trim()) ||
              !isInitialized
            }
          >
            {minting ? 'Minting...' : 'Mint NFT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
