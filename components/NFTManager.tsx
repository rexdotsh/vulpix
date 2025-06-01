'use client';

import { useState, useEffect } from 'react';
import { usePolkadotExtension } from '@/hooks/usePolkadotExtension';
import { AssetHubNFTManager, type UserNFT } from '@/lib/AssetHubNFTManager';

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

const NFTManager = () => {
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
    enableOnMount: true,
  });

  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchNFTs = async () => {
      if (!isReady || !selectedAccount || isLoading) return;

      setIsLoading(true);
      try {
        const nftManager = new AssetHubNFTManager();
        await nftManager.initialize();
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
          setIsLoading(false);
        }
      }
    };

    fetchNFTs();
    return () => {
      isCancelled = true;
    };
  }, [isReady, selectedAccount?.address]);

  if (!isReady) {
    return (
      <div className="p-4">
        <h1 className="text-xl mb-4">Connect Wallet</h1>
        <button
          type="button"
          onClick={enableExtensions}
          disabled={isConnecting}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl">NFTs ({userNFTs.length})</h1>
        <button
          type="button"
          onClick={disconnectExtensions}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Disconnect
        </button>
      </div>

      <div className="mb-4">
        <select
          value={selectedAccountIndex}
          onChange={(e) => selectAccount(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {accounts.map((account, index) => (
            <option key={account.address} value={index}>
              {account.meta.name || account.address.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : userNFTs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userNFTs.map((nft) => {
            const metadata = decodeHexMetadata(nft.itemMetadata?.data);
            const imageUrl = getIpfsImageUrl(metadata);

            return (
              <div
                key={`${nft.collection}-${nft.item}`}
                className="border rounded p-3"
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={metadata?.name || `NFT ${nft.item}`}
                    className="w-full h-32 object-cover rounded mb-2"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <h3 className="font-medium">
                  {metadata?.name || `Item #${nft.item}`}
                </h3>
                <p className="text-sm text-gray-600">
                  Collection: {nft.collection}
                </p>
                <p className="text-sm text-gray-600">Item: {nft.item}</p>
                {metadata?.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {metadata.description}
                  </p>
                )}
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
