'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  ASSET_HUB_CHAIN_ID,
  ASSET_HUB_NETWORK_CONFIG,
} from '@/lib/constants/chains';

declare global {
  interface Window {
    talismanEth: any;
  }
}

export function useTalismanWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      checkTalismanAvailability();
    }
  }, []);

  const checkTalismanAvailability = () => {
    if (!window.talismanEth) {
      setConnectionStatus('Talisman wallet not found');
      setIsConnected(false);
    } else {
      checkConnection();
    }
  };

  const checkConnection = async () => {
    if (!window.talismanEth) {
      setConnectionStatus('Talisman wallet not found');
      return false;
    }

    try {
      const accounts = await window.talismanEth.request({
        method: 'eth_accounts',
      });

      if (accounts && accounts.length > 0) {
        setIsConnected(true);
        setConnectionStatus('Connected');
        return true;
      } else {
        setIsConnected(false);
        setConnectionStatus('Please connect Talisman wallet');
        return false;
      }
    } catch (error: any) {
      console.error('Talisman connection check failed:', error);
      setIsConnected(false);
      setConnectionStatus('Talisman connection error');
      return false;
    }
  };

  const connectWallet = async () => {
    if (!window.talismanEth) {
      toast.error('Talisman wallet not found. Please install Talisman.');
      return false;
    }

    try {
      const accounts = await window.talismanEth.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setIsConnected(true);
        setConnectionStatus('Connected');
        toast.success('Talisman wallet connected!');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Failed to connect Talisman wallet:', error);

      if (error.code === 4001 || error.message?.includes('rejected')) {
        setConnectionStatus('Connection rejected by user');
      } else {
        setConnectionStatus(`Connection failed: ${error.message}`);
        toast.error('Failed to connect Talisman wallet');
      }
      return false;
    }
  };

  const switchToAssetHubNetwork = async () => {
    if (!window.talismanEth) {
      throw new Error('Talisman wallet not found');
    }

    try {
      await window.talismanEth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ASSET_HUB_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await window.talismanEth.request({
            method: 'wallet_addEthereumChain',
            params: [ASSET_HUB_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to switch to AssetHub network:', addError);
          toast.error('Failed to switch to AssetHub network');
        }
      } else {
        throw switchError;
      }
    }
  };

  return {
    isConnected,
    connectionStatus,
    setConnectionStatus,
    connectWallet,
    switchToAssetHubNetwork,
    checkConnection,
  };
}
