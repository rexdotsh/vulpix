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
  const [currentChainId, setCurrentChainId] = useState<string>('');
  const [ethAddress, setEthAddress] = useState<string>('');
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const hasInitialized = useRef(false);
  const isOnAssetHub = currentChainId === ASSET_HUB_CHAIN_ID;

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      checkTalismanAvailability();
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      checkCurrentNetwork();
    }
  }, [isConnected]);

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
        setEthAddress(accounts[0]);
        setConnectionStatus('Connected');
        await checkCurrentNetwork();
        return true;
      } else {
        setIsConnected(false);
        setEthAddress('');
        setConnectionStatus('Please connect Talisman wallet');
        return false;
      }
    } catch (error: any) {
      console.error('Talisman connection check failed:', error);
      setIsConnected(false);
      setEthAddress('');
      setConnectionStatus('Talisman connection error');
      return false;
    }
  };

  const checkCurrentNetwork = async () => {
    if (!window.talismanEth) return;

    setIsCheckingNetwork(true);
    try {
      const chainId = await window.talismanEth.request({
        method: 'eth_chainId',
      });
      setCurrentChainId(chainId);
    } catch (error) {
      console.error('Failed to check current network:', error);
    } finally {
      setIsCheckingNetwork(false);
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
        setEthAddress(accounts[0]);
        setConnectionStatus('Connected');
        await checkCurrentNetwork();
        toast.success('Talisman wallet connected!');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Failed to connect Talisman wallet:', error);

      if (error.code !== 4001 && !error.message?.includes('rejected')) {
        setConnectionStatus(`Connection failed: ${error.message}`);
        toast.error('Failed to connect Talisman wallet');
      } else {
        setConnectionStatus('Connection rejected by user');
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
      toast.success('Successfully switched to AssetHub network!');
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await window.talismanEth.request({
            method: 'wallet_addEthereumChain',
            params: [ASSET_HUB_NETWORK_CONFIG],
          });

          await checkCurrentNetwork();
          toast.success('Successfully added and switched to AssetHub network!');
        } catch (addError: any) {
          console.error('Failed to add AssetHub network:', addError);
          if (addError.code !== 4001) {
            toast.error('Failed to add AssetHub network');
          }
        }
      } else if (switchError.code !== 4001) {
        toast.error('Failed to switch to AssetHub network');
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  return {
    isConnected,
    connectionStatus,
    ethAddress,
    currentChainId,
    isOnAssetHub,
    isCheckingNetwork,
    isSwitchingNetwork,
    connectWallet,
    switchToAssetHubNetwork,
    checkConnection,
    checkCurrentNetwork,
    setConnectionStatus,
  };
}
