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
  isInitialized: boolean;
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

const STORAGE_KEY = 'polkadot-extension-connection';

export const usePolkadotExtension = ({
  appName,
  enableOnMount = false,
}: UsePolkadotExtensionProps): UsePolkadotExtensionReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Save connection state to localStorage
  const saveConnectionState = useCallback(
    (connected: boolean, accountIndex = 0) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            connected,
            selectedAccountIndex: accountIndex,
            timestamp: Date.now(),
          }),
        );
      }
    },
    [],
  );

  // load connection state from localStorage
  const loadConnectionState = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const {
            connected,
            selectedAccountIndex: storedIndex,
            timestamp,
          } = JSON.parse(stored);
          // only reconnect if the stored state is less than 24 hours old
          const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000;
          return {
            connected: connected && isRecent,
            selectedAccountIndex: storedIndex || 0,
          };
        }
      } catch (error) {
        console.warn('Failed to load connection state:', error);
      }
    }
    return { connected: false, selectedAccountIndex: 0 };
  }, []);

  const enableExtensions = useCallback(async () => {
    if (!isExtensionAvailable) {
      setError(
        'No Polkadot extensions found. Please install Polkadot.js, Talisman, or another compatible wallet.',
      );
      setIsInitialized(true);
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
          const hasAccounts = injectedAccounts.length > 0;
          setIsReady(hasAccounts);

          if (hasAccounts) {
            // restore selected account index from localStorage
            const { selectedAccountIndex: storedIndex } = loadConnectionState();
            const validIndex =
              storedIndex < injectedAccounts.length ? storedIndex : 0;
            setSelectedAccountIndex(validIndex);
            saveConnectionState(true, validIndex);
          } else {
            setError(
              'No accounts found. Please create an account in your wallet extension.',
            );
          }

          setIsInitialized(true);
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
      saveConnectionState(false);
      setIsInitialized(true);
    } finally {
      setIsConnecting(false);
    }
  }, [appName, isExtensionAvailable, loadConnectionState, saveConnectionState]);

  const selectAccount = useCallback(
    (index: number) => {
      if (index >= 0 && index < accounts.length) {
        setSelectedAccountIndex(index);
        saveConnectionState(true, index);
      }
    },
    [accounts.length, saveConnectionState],
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
    saveConnectionState(false);
  }, [unsubscribe, saveConnectionState]);

  useEffect(() => {
    const initializeConnection = async () => {
      // if not in browser, mark as initialized immediately
      if (typeof window === 'undefined') {
        setIsInitialized(true);
        return;
      }

      const { connected } = loadConnectionState();

      if (
        (enableOnMount || connected) &&
        !isReady &&
        !isConnecting &&
        isExtensionAvailable
      ) {
        await enableExtensions();
      } else {
        // if we're not going to try connecting, mark as initialized
        setIsInitialized(true);
      }
    };

    // use a small delay to let the page settle and extensions load
    const timeoutId = setTimeout(initializeConnection, 50);

    return () => clearTimeout(timeoutId);
  }, [
    enableOnMount,
    isReady,
    isConnecting,
    isExtensionAvailable,
    enableExtensions,
    loadConnectionState,
  ]);

  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  return {
    isInitialized,
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
