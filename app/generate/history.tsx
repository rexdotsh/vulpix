'use client';

import {} from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
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
  return (
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
        {image.status === 'completed' && image.imageUrl && (
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
        )}
      </CardFooter>
    </Card>
  );
}
