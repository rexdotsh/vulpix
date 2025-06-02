'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePolkadot } from '@/lib/PolkadotProvider';
import { useAssetHub } from '@/lib/AssetHubProvider';
import type { UserNFT } from '@/lib/AssetHubNFTManager';

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
    return `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}`;
  }
  if (typeof image === 'string' && image.length > 40) {
    return `https://ipfs.io/ipfs/${image}`;
  }
  return image;
};

export default function Dashboard() {
  const {
    isReady,
    selectedAccount,
    selectedAccountIndex,
    accounts,
    selectAccount,
    disconnectExtensions,
  } = usePolkadot();

  const {
    nftManager,
    isInitialized,
    isInitializing,
    error: assetHubError,
  } = useAssetHub();

  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchNFTs = async () => {
      if (
        !isReady ||
        !selectedAccount ||
        !nftManager ||
        !isInitialized ||
        isLoadingNFTs
      )
        return;

      setIsLoadingNFTs(true);
      try {
        if (!isCancelled) {
          const nfts = await nftManager.getUserNFTs(selectedAccount.address);
          if (!isCancelled) {
            setUserNFTs(nfts);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingNFTs(false);
        }
      }
    };

    fetchNFTs();
    return () => {
      isCancelled = true;
    };
  }, [isReady, selectedAccount?.address, nftManager, isInitialized]);

  if (!isReady) {
    return (
      <div className="p-4">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-xl mb-4">Wallet Not Connected</h1>
          <p className="text-gray-600">Please connect your wallet first.</p>
          <Link
            href="/"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          {isInitializing ? (
            <>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="text-gray-600">Connecting to AssetHub...</p>
            </>
          ) : assetHubError ? (
            <>
              <div className="text-red-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Connection Failed
              </h3>
              <p className="text-red-600 mb-4">{assetHubError}</p>
              <Link
                href="/"
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Go to Home
              </Link>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  const isLoading = isLoadingNFTs || isInitializing;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                AssetHub NFT Manager
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedAccountIndex}
                onChange={(e) => selectAccount(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map((account, index) => (
                  <option key={account.address} value={index}>
                    {account.meta.name || account.address.slice(0, 8)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={disconnectExtensions}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            My NFTs ({userNFTs.length})
          </h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="mt-2 text-gray-600">
              {isInitializing ? 'Connecting to AssetHub...' : 'Loading NFTs...'}
            </p>
          </div>
        ) : userNFTs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userNFTs.map((nft) => {
              const metadata = decodeHexMetadata(nft.itemMetadata?.data);
              const imageUrl = getIpfsImageUrl(metadata);

              return (
                <div
                  key={`${nft.collection}-${nft.item}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {imageUrl && (
                    <div className="aspect-square bg-gray-100">
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
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {metadata?.name || `Item #${nft.item}`}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Collection: {nft.collection}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Item: {nft.item}
                    </p>
                    {metadata?.description && (
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {metadata.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No NFTs Found
            </h3>
            <p className="text-gray-600">
              This account doesn't have any NFTs on AssetHub yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
