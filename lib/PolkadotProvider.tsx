'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import {
  usePolkadotExtension,
  type UsePolkadotExtensionReturn,
} from '@/hooks/usePolkadotExtension';

type PolkadotContextType = UsePolkadotExtensionReturn;

const PolkadotContext = createContext<PolkadotContextType | undefined>(
  undefined,
);

interface PolkadotProviderProps {
  children: ReactNode;
}

export function PolkadotProvider({ children }: PolkadotProviderProps) {
  const polkadotState = usePolkadotExtension({
    appName: 'AssetHub NFT Manager',
    enableOnMount: false,
  });

  return (
    <PolkadotContext.Provider value={polkadotState}>
      {children}
    </PolkadotContext.Provider>
  );
}

export function usePolkadot(): PolkadotContextType {
  const context = useContext(PolkadotContext);
  if (context === undefined) {
    throw new Error('usePolkadot must be used within a PolkadotProvider');
  }
  return context;
}
