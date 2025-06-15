'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { useTalismanWallet } from '@/hooks/useTalismanWallet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wallet,
  Link,
  AlertCircle,
  Loader2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    talismanEth: any;
  }
}

interface WalletLinkingProps {
  onLinkingComplete?: () => void;
}

export function WalletLinking({ onLinkingComplete }: WalletLinkingProps) {
  const { selectedAccount } = usePolkadot();
  const [isLinking, setIsLinking] = useState(false);
  const linkEthereumAddress = useMutation(api.users.linkEthereumAddress);

  const {
    isConnected: talismanConnected,
    ethAddress,
    isOnAssetHub,
    isCheckingNetwork,
    isSwitchingNetwork,
    connectWallet,
    switchToAssetHubNetwork,
  } = useTalismanWallet();

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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Polkadot Wallet</p>
              <p className="text-sm text-muted-foreground">
                {selectedAccount.meta.name || 'Connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {selectedAccount.address.slice(0, 6)}...
              {selectedAccount.address.slice(-4)}
            </Badge>
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                talismanConnected ? 'bg-primary/10' : 'bg-muted'
              }`}
            >
              <Wallet
                className={`h-4 w-4 ${
                  talismanConnected ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </div>
            <div>
              <p className="font-medium">Ethereum Wallet</p>
              <p className="text-sm text-muted-foreground">
                {talismanConnected ? 'Talisman Extension' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {talismanConnected && ethAddress && (
              <Badge variant="outline" className="font-mono text-xs">
                {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
              </Badge>
            )}
            <div
              className={`w-2 h-2 rounded-full ${
                talismanConnected ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          </div>
        </div>

        {talismanConnected && (
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isOnAssetHub
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-orange-100 dark:bg-orange-900/20'
                }`}
              >
                {isOnAssetHub ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              <div>
                <p className="font-medium">Network Status</p>
                <p className="text-sm text-muted-foreground">
                  {isOnAssetHub
                    ? 'AssetHub Network'
                    : 'Switch to AssetHub required'}
                  {isCheckingNetwork && ' (Checking...)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isOnAssetHub ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isOnAssetHub ? 'Ready' : 'Switch Required'}
              </Badge>
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnAssetHub ? 'bg-green-500' : 'bg-orange-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
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
          <Button onClick={connectWallet} className="w-full" size="lg">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Talisman Wallet
          </Button>
        )}

        {talismanConnected && (
          <div className="space-y-3">
            <Button
              onClick={switchToAssetHubNetwork}
              disabled={isSwitchingNetwork || isOnAssetHub}
              variant={isOnAssetHub ? 'outline' : 'default'}
              className="w-full"
            >
              {isSwitchingNetwork ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Switching Network...
                </>
              ) : isOnAssetHub ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Connected to AssetHub
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Switch to AssetHub Network
                </>
              )}
            </Button>

            <Button
              onClick={handleLinkAddresses}
              disabled={isLinking || !isOnAssetHub}
              className="w-full"
              size="lg"
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

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border">
        <strong>Why link wallets?</strong> Battles use your Polkadot address for
        NFT ownership and your Ethereum address for smart contract interactions
        via PolkaVM.
      </div>
    </div>
  );
}
