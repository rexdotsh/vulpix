'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AssetHubNFTManager } from './AssetHubNFTManager';

interface AssetHubContextType {
  nftManager: AssetHubNFTManager | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
}

const AssetHubContext = createContext<AssetHubContextType | undefined>(
  undefined,
);

interface AssetHubProviderProps {
  children: ReactNode;
}

export function AssetHubProvider({ children }: AssetHubProviderProps) {
  const [nftManager] = useState(() => new AssetHubNFTManager());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeAssetHub = async () => {
    if (isInitialized || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      await nftManager.initialize();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!isInitialized && !isInitializing && mounted) {
      initializeAssetHub();
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      nftManager.disconnect().catch(console.error);
    };
  }, [nftManager]);

  const contextValue: AssetHubContextType = {
    nftManager: isInitialized ? nftManager : null,
    isInitialized,
    isInitializing,
    error,
  };

  return (
    <AssetHubContext.Provider value={contextValue}>
      {children}
    </AssetHubContext.Provider>
  );
}

export function useAssetHub(): AssetHubContextType {
  const context = useContext(AssetHubContext);
  if (context === undefined) {
    throw new Error('useAssetHub must be used within an AssetHubProvider');
  }
  return context;
}
