'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wallet,
  Link,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    talismanEth: any;
  }
}

interface WalletLinkingProps {
  onLinkingComplete?: () => void;
  showTitle?: boolean;
}

export function WalletLinking({
  onLinkingComplete,
  showTitle = true,
}: WalletLinkingProps) {
  const { selectedAccount } = usePolkadot();
  const [isLinking, setIsLinking] = useState(false);
  const [talismanConnected, setTalismanConnected] = useState(false);
  const [ethAddress, setEthAddress] = useState<string>('');

  // Query user's link status
  const linkStatus = useQuery(
    api.battle.getUserLinkStatus,
    selectedAccount ? { polkadotAddress: selectedAccount.address } : 'skip',
  );

  // Mutation to link addresses
  const linkEthereumAddress = useMutation(api.users.linkEthereumAddress);

  useEffect(() => {
    checkTalismanConnection();
  }, []);

  const checkTalismanConnection = async () => {
    if (!window.talismanEth) return;

    try {
      const accounts = await window.talismanEth.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        setTalismanConnected(true);
        setEthAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to check Talisman connection:', error);
    }
  };

  const connectTalisman = async () => {
    if (!window.talismanEth) {
      toast.error(
        'Talisman wallet not found. Please install Talisman extension.',
      );
      return;
    }

    try {
      const accounts = await window.talismanEth.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setTalismanConnected(true);
        setEthAddress(accounts[0]);
        toast.success('Talisman wallet connected!');
      }
    } catch (error: any) {
      console.error('Failed to connect Talisman:', error);
      toast.error('Failed to connect Talisman wallet');
    }
  };

  const switchToAssetHubNetwork = async () => {
    try {
      const chainId = `0x190f1b45`;
      await window.talismanEth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      toast.success('Switched to AssetHub network!');
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
          toast.success('AssetHub network added and switched!');
        } catch (addError: any) {
          toast.error(`Failed to add network: ${addError.message}`);
        }
      } else {
        toast.error(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  const handleLinkAddresses = async () => {
    if (!selectedAccount || !ethAddress) return;

    setIsLinking(true);
    try {
      await linkEthereumAddress({
        polkadotAddress: selectedAccount.address,
        ethereumAddress: ethAddress,
      });

      toast.success('Wallet addresses linked successfully!');
      onLinkingComplete?.();
    } catch (error: any) {
      console.error('Failed to link addresses:', error);
      toast.error(error.message || 'Failed to link wallet addresses');
    } finally {
      setIsLinking(false);
    }
  };

  if (!selectedAccount) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please connect your Polkadot wallet first.
        </AlertDescription>
      </Alert>
    );
  }

  // If already linked, show success state
  if (linkStatus?.hasLinkedEthAddress) {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardHeader>
          {showTitle && (
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Wallets Linked
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Polkadot:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {selectedAccount.address.slice(0, 8)}...
                {selectedAccount.address.slice(-6)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ethereum:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {linkStatus.ethAddress?.slice(0, 8)}...
                {linkStatus.ethAddress?.slice(-6)}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            ✅ Ready for battles! Your wallets are linked and ready to use.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {showTitle && (
          <>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Link Your Wallets
            </CardTitle>
            <CardDescription>
              Connect both Polkadot and Ethereum addresses to participate in
              battles
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Polkadot Wallet</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {selectedAccount.address.slice(0, 8)}...
              {selectedAccount.address.slice(-6)}
            </Badge>
          </div>

          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              talismanConnected ? 'bg-green-50 dark:bg-green-950' : 'bg-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              {talismanConnected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">Ethereum Wallet (Talisman)</span>
            </div>
            {talismanConnected ? (
              <Badge variant="outline" className="font-mono text-xs">
                {ethAddress.slice(0, 8)}...{ethAddress.slice(-6)}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                Not connected
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!window.talismanEth && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Talisman wallet extension required</span>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://talisman.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Install <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {window.talismanEth && !talismanConnected && (
            <Button onClick={connectTalisman} className="w-full">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Talisman Wallet
            </Button>
          )}

          {talismanConnected && (
            <div className="space-y-2">
              <Button
                onClick={switchToAssetHubNetwork}
                variant="outline"
                className="w-full"
              >
                Switch to AssetHub Network
              </Button>

              <Button
                onClick={handleLinkAddresses}
                disabled={isLinking}
                className="w-full"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking Wallets...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Link Wallet Addresses
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Why link wallets?</strong> Battles use your Polkadot address
            for NFT ownership and your Ethereum address for smart contract
            interactions via PolkaVM.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
