'use client';

import { useState, useEffect } from 'react';
import { usePolkadotExtension } from '@/hooks/usePolkadotExtension';
import { AssetHubNFTManager, type UserNFT } from '@/lib/AssetHubNFTManager';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// Helper function to decode hex metadata
const decodeHexMetadata = (hexString: string) => {
  try {
    if (!hexString || hexString === '0x') return null;
    const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [],
    );
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode metadata:', error);
    return null;
  }
};

// Helper function to get IPFS image URL
const getIpfsImageUrl = (metadata: any) => {
  if (!metadata) return null;
  const image = metadata.image;
  if (!image) return null;

  // Handle IPFS URLs
  if (image.startsWith('ipfs://')) {
    const cid = image.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${cid}`;
  }

  // Handle direct CIDs
  if (typeof image === 'string' && image.length > 40) {
    return `https://ipfs.io/ipfs/${image}`;
  }

  return image;
};

const NFTManager = () => {
  const [isMounted, setIsMounted] = useState(false);

  const {
    isReady,
    isConnecting,
    error,
    accounts,
    selectedAccount,
    selectedAccountIndex,
    enableExtensions,
    selectAccount,
    disconnectExtensions,
  } = usePolkadotExtension({
    appName: 'AssetHub NFT Manager',
    enableOnMount: false,
  });

  const [nftManager] = useState(() => new AssetHubNFTManager());
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (isReady && selectedAccount) {
        setIsLoading(true);
        try {
          await nftManager.initialize();
          const nfts = await nftManager.getUserNFTs(selectedAccount.address);
          setUserNFTs(nfts);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchNFTs();
  }, [isReady, selectedAccount, nftManager]);

  if (!isMounted) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
        <button
          type="button"
          onClick={enableExtensions}
          disabled={isConnecting}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <p className="text-red-500 mt-2">Error: {error}</p>}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your NFTs</h1>
        <button
          type="button"
          onClick={disconnectExtensions}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold">Accounts</h2>
        <ul>
          {accounts.map((account: InjectedAccountWithMeta, index: number) => (
            <li
              key={account.address}
              onClick={() => selectAccount(index)}
              className={`cursor-pointer ${index === selectedAccountIndex ? 'font-bold' : ''}`}
            >
              {account.meta.name || account.address}
            </li>
          ))}
        </ul>
      </div>
      {isLoading ? (
        <p>Loading NFTs...</p>
      ) : userNFTs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userNFTs.map((nft: UserNFT) => {
            const decodedMetadata = decodeHexMetadata(nft.itemMetadata?.data);
            const imageUrl = getIpfsImageUrl(decodedMetadata);

            return (
              <div
                key={`${nft.collection}-${nft.item}`}
                className="border rounded-lg p-4 bg-white shadow"
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={decodedMetadata?.name || `NFT ${nft.item}`}
                    className="w-full h-48 object-cover rounded mb-3"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {decodedMetadata?.name || `Item #${nft.item}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Collection: {nft.collection}
                  </p>
                  <p className="text-sm text-gray-600">Item: {nft.item}</p>
                  {decodedMetadata?.description && (
                    <p className="text-sm text-gray-700">
                      {decodedMetadata.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No NFTs found.</p>
      )}
    </div>
  );
};

export default NFTManager;
