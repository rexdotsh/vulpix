'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [currentChainId, setCurrentChainId] = useState<string>('');
  const [ethAddress, setEthAddress] = useState<string>('');
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  const isOnAssetHub = currentChainId === ASSET_HUB_CHAIN_ID;

  const checkCurrentNetwork = useCallback(async () => {
    if (!window.talismanEth) return;

    setIsCheckingNetwork(true);
    try {
      const chainId = await window.talismanEth.request({
        method: 'eth_chainId',
      });
      setCurrentChainId(chainId);
    } catch (error) {
      console.error('Failed to check network:', error);
    } finally {
      setIsCheckingNetwork(false);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (!window.talismanEth) return false;

    try {
      const accounts = await window.talismanEth.request({
        method: 'eth_accounts',
      });
      if (accounts?.length > 0) {
        setIsConnected(true);
        setEthAddress(accounts[0]);
        await checkCurrentNetwork();
        return true;
      }
      setIsConnected(false);
      setEthAddress('');
      return false;
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
      setEthAddress('');
      return false;
    }
  }, [checkCurrentNetwork]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectWallet = async () => {
    if (!window.talismanEth) {
      toast.error('Please install Talisman wallet extension');
      return false;
    }

    try {
      const accounts = await window.talismanEth.request({
        method: 'eth_requestAccounts',
      });
      if (accounts?.length > 0) {
        setIsConnected(true);
        setEthAddress(accounts[0]);
        await checkCurrentNetwork();
        toast.success('Wallet connected!');
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.code !== 4001) {
        toast.error('Failed to connect wallet');
      }
      return false;
    }
  };

  const switchToAssetHubNetwork = async () => {
    if (!window.talismanEth) {
      toast.error('Talisman wallet not found');
      return;
    }

    setIsSwitchingNetwork(true);
    try {
      await window.talismanEth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ASSET_HUB_CHAIN_ID }],
      });
      await checkCurrentNetwork();
      toast.success('Switched to AssetHub network!');
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await window.talismanEth.request({
            method: 'wallet_addEthereumChain',
            params: [ASSET_HUB_NETWORK_CONFIG],
          });
          await checkCurrentNetwork();
          toast.success('Added AssetHub network!');
        } catch (addError: any) {
          if (addError.code !== 4001) {
            toast.error('Failed to add network');
          }
        }
      } else if (switchError.code !== 4001) {
        toast.error('Failed to switch network');
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  return {
    isConnected,
    ethAddress,
    isOnAssetHub,
    isCheckingNetwork,
    isSwitchingNetwork,
    connectionStatus,
    setConnectionStatus,
    connectWallet,
    switchToAssetHubNetwork,
    checkConnection,
  };
}
