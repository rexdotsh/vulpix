'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAssetHub } from '@/lib/AssetHubProvider';
import { Button } from '@/components/ui/button';

export default function Page() {
  const { isInitialized, isInitializing } = useAssetHub();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            AssetHub NFT Manager
          </h1>
        </div>

        <Link href="/dashboard">
          <Button
            size="lg"
            disabled={!isInitialized}
            className="text-lg px-8 py-6"
          >
            {isInitializing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </>
            ) : isInitialized ? (
              <>
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              'Connect Wallet First'
            )}
          </Button>
        </Link>

        {!isInitialized && !isInitializing && (
          <p className="text-sm text-gray-500">
            Connect your wallet to access your NFTs
          </p>
        )}
      </div>
    </div>
  );
}
