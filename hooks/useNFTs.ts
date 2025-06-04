import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';

export function useNFTs() {
  const { isReady, selectedAccount, getInjector } = usePolkadot();
  const { nftManager, isInitialized } = useAssetHub();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasAttemptedInitialSync, setHasAttemptedInitialSync] = useState(false);

  const createOrGetUser = useMutation(api.functions.users.createOrGetUser);
  const syncUserNFTs = useMutation(api.functions.nft.syncUserNFTs);
  const syncUserCollections = useMutation(
    api.functions.nft.syncUserCollections,
  );

  const nfts = useQuery(
    api.functions.nft.getUserNFTs,
    selectedAccount ? { address: selectedAccount.address } : 'skip',
  );
  const collections = useQuery(
    api.functions.nft.getUserCollections,
    selectedAccount ? { address: selectedAccount.address } : 'skip',
  );
  const lastSyncTime = useQuery(
    api.functions.nft.getLastSyncTime,
    selectedAccount ? { address: selectedAccount.address } : 'skip',
  );

  // automatically sync if user has no NFTs in database and AssetHub is initialized
  useEffect(() => {
    const autoSync = async () => {
      if (
        isReady &&
        selectedAccount &&
        isInitialized &&
        nfts !== undefined &&
        nfts.length === 0 &&
        !lastSyncTime &&
        !isSyncing &&
        !hasAttemptedInitialSync
      ) {
        setHasAttemptedInitialSync(true);
        await syncFromAssetHub();
      }
    };

    autoSync();
  }, [
    isReady,
    selectedAccount,
    isInitialized,
    nfts,
    lastSyncTime,
    isSyncing,
    hasAttemptedInitialSync,
  ]);

  const initializeUser = async () => {
    if (!isReady || !selectedAccount) return;

    try {
      await createOrGetUser({ address: selectedAccount.address });
      return true;
    } catch (err) {
      console.error('Error initializing user:', err);
      return false;
    }
  };

  const syncFromAssetHub = async () => {
    if (
      !isReady ||
      !selectedAccount ||
      !nftManager ||
      !isInitialized ||
      isSyncing
    ) {
      return { success: false, error: 'Not ready to sync' };
    }

    setIsSyncing(true);
    try {
      await initializeUser();

      const assetHubNFTs = await nftManager.getUserNFTs(
        selectedAccount.address,
      );
      const assetHubCollections = await nftManager.getUserCollections(
        selectedAccount.address,
      );

      if (assetHubNFTs.length > 0) {
        await syncUserNFTs({
          address: selectedAccount.address,
          nfts: assetHubNFTs,
        });
      }

      if (assetHubCollections.length > 0) {
        await syncUserCollections({
          address: selectedAccount.address,
          collections: assetHubCollections,
        });
      }

      return {
        success: true,
        nftCount: assetHubNFTs.length,
        collectionCount: assetHubCollections.length,
      };
    } catch (err) {
      console.error('Error syncing NFTs:', err);
      return { success: false, error: String(err) };
    } finally {
      setIsSyncing(false);
    }
  };

  const burnNFT = async (collectionId: string, itemId: string) => {
    if (!isReady || !selectedAccount || !nftManager || !isInitialized) {
      return { success: false, error: 'Not ready to burn NFT' };
    }

    try {
      const injector = await getInjector(selectedAccount.address);
      if (!injector) throw new Error('Failed to get injector');

      const result = await nftManager.burnNFT(
        selectedAccount.address,
        injector,
        collectionId,
        itemId,
      );

      await syncFromAssetHub();

      return { success: true, result };
    } catch (err) {
      console.error('Error burning NFT:', err);
      return { success: false, error: String(err) };
    }
  };

  return {
    nfts,
    collections,
    lastSyncTime,
    isSyncing,
    syncFromAssetHub,
    burnNFT,
    initializeUser,
  };
}
