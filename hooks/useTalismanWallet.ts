'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    talismanEth: any;
  }
}

export function useTalismanWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

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
      setConnectionStatus(`Connection failed: ${error.message}`);
      toast.error('Failed to connect Talisman wallet');
      return false;
    }
  };

  const switchToAssetHubNetwork = async () => {
    if (!window.talismanEth) {
      throw new Error('Talisman wallet not found');
    }

    try {
      const chainId = `0x190f1b45`;
      await window.talismanEth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          const chainId = `0x190f1b45`;
          await window.talismanEth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId,
                chainName: 'Asset Hub Testnet',
                nativeCurrency: {
                  name: 'Asset Hub Token',
                  symbol: 'PAS',
                  decimals: 18,
                },
                rpcUrls: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
                blockExplorerUrls: [
                  'https://blockscout-passet-hub.parity-testnet.parity.io',
                ],
              },
            ],
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
