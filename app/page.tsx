'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { Button } from '@/components/ui/button';

export default function Page() {
  const { isInitialized, isInitializing } = useAssetHub();
  const { isReady: isWalletReady, isConnecting: isWalletConnecting } =
    usePolkadot();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            AssetHub NFT Manager
          </h1>
        </div>

        {isWalletReady && isInitialized ? (
          <div className="flex justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                <>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              </Button>
            </Link>
            <Link href="/generate">
              <Button size="lg" className="text-lg px-8 py-6">
                <>
                  Go to Generate
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              </Button>
            </Link>
          </div>
        ) : (
          <Button size="lg" disabled className="text-lg px-8 py-6">
            {isWalletConnecting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting Wallet...
              </>
            ) : !isWalletReady ? (
              'Connect Wallet First'
            ) : isInitializing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Initializing AssetHub...
              </>
            ) : (
              'Unable to connect'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
