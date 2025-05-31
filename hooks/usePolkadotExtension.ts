import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from '@polkadot/extension-inject/types';
import { useCallback, useEffect, useState } from 'react';

// extend Window interface to include injectedWeb3
declare global {
  interface Window {
    injectedWeb3?: Record<string, any>;
  }
}

export interface UsePolkadotExtensionProps {
  appName: string;
  enableOnMount?: boolean;
}

export interface UsePolkadotExtensionReturn {
  // Connection state
  isReady: boolean;
  isConnecting: boolean;
  error: string | null;

  // Extension data
  extensions: InjectedExtension[];
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  selectedAccountIndex: number;

  // Actions
  enableExtensions: () => Promise<void>;
  selectAccount: (index: number) => void;
  getInjector: (address: string) => Promise<InjectedExtension | null>;
  disconnectExtensions: () => void;

  // Utils
  isExtensionAvailable: boolean;
}

export const usePolkadotExtension = ({
  appName,
  enableOnMount = false,
}: UsePolkadotExtensionProps): UsePolkadotExtensionReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extensions, setExtensions] = useState<InjectedExtension[]>([]);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // check if extensions are available
  const isExtensionAvailable =
    typeof window !== 'undefined' &&
    !!window.injectedWeb3 &&
    Object.keys(window.injectedWeb3).length > 0;

  const selectedAccount = accounts[selectedAccountIndex] || null;

  const enableExtensions = useCallback(async () => {
    if (!isExtensionAvailable) {
      setError(
        'No Polkadot extensions found. Please install Polkadot.js, Talisman, or another compatible wallet.',
      );
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // dynamic import to avoid SSR issues
      const { web3Enable, web3AccountsSubscribe } = await import(
        '@polkadot/extension-dapp'
      );

      const injectedExtensions = await web3Enable(appName);

      if (injectedExtensions.length === 0) {
        throw new Error(
          'No extensions authorized. Please authorize the connection in your wallet.',
        );
      }

      setExtensions(injectedExtensions);

      const unsubscribeFn = await web3AccountsSubscribe(
        (injectedAccounts: InjectedAccountWithMeta[]) => {
          setAccounts(injectedAccounts);
          setIsReady(injectedAccounts.length > 0);

          if (injectedAccounts.length === 0) {
            setError(
              'No accounts found. Please create an account in your wallet extension.',
            );
          }
        },
      );

      setUnsubscribe(() => unsubscribeFn);
    } catch (err) {
      console.error('Extension connection error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to wallet extension',
      );
      setIsReady(false);
    } finally {
      setIsConnecting(false);
    }
  }, [appName, isExtensionAvailable]);

  const selectAccount = useCallback(
    (index: number) => {
      if (index >= 0 && index < accounts.length) {
        setSelectedAccountIndex(index);
      }
    },
    [accounts.length],
  );

  const getInjector = useCallback(
    async (address: string): Promise<InjectedExtension | null> => {
      try {
        const account = accounts.find((acc) => acc.address === address);
        if (!account) return null;

        // dynamic import to avoid SSR issues
        const { web3FromSource } = await import('@polkadot/extension-dapp');
        return await web3FromSource(account.meta.source);
      } catch (err) {
        console.error('Failed to get injector:', err);
        return null;
      }
    },
    [accounts],
  );

  const disconnectExtensions = useCallback(() => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    setIsReady(false);
    setAccounts([]);
    setExtensions([]);
    setSelectedAccountIndex(0);
    setError(null);
  }, [unsubscribe]);

  useEffect(() => {
    if (enableOnMount && !isReady && !isConnecting && isExtensionAvailable) {
      enableExtensions();
    }
  }, [
    enableOnMount,
    isReady,
    isConnecting,
    isExtensionAvailable,
    enableExtensions,
  ]);

  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  return {
    isReady,
    isConnecting,
    error,
    extensions,
    accounts,
    selectedAccount,
    selectedAccountIndex,
    enableExtensions,
    selectAccount,
    getInjector,
    disconnectExtensions,
    isExtensionAvailable,
  };
};
