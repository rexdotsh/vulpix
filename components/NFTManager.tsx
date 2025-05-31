'use client';

import { useState, useEffect } from 'react';
import { usePolkadotExtension } from '@/hooks/usePolkadotExtension';
import { AssetHubNFTManager, type UserNFT } from '@/lib/AssetHubNFTManager';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

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
        <ul>
          {userNFTs.map((nft: UserNFT) => (
            <li key={`${nft.collection}-${nft.item}`} className="mb-2">
              Collection: {nft.collection}, Item: {nft.item}
            </li>
          ))}
        </ul>
      ) : (
        <p>No NFTs found.</p>
      )}
    </div>
  );
};

export default NFTManager;
