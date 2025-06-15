'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWalletRequirements } from '@/lib/hooks/useWalletRequirements';
import { WalletRequirementsCard } from '@/components/battle/WalletRequirementsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Link, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletLinkingProps {
  onLinkingComplete?: () => void;
}

export function WalletLinking({ onLinkingComplete }: WalletLinkingProps) {
  const [isLinking, setIsLinking] = useState(false);
  const { selectedAccount, ethAddress, requirements } = useWalletRequirements();
  const linkEthereumAddress = useMutation(api.users.linkEthereumAddress);

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
      {/* Wallet Status Display */}
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
                requirements.talismanConnected ? 'bg-primary/10' : 'bg-muted'
              }`}
            >
              <Wallet
                className={`h-4 w-4 ${
                  requirements.talismanConnected
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              />
            </div>
            <div>
              <p className="font-medium">Ethereum Wallet</p>
              <p className="text-sm text-muted-foreground">
                {requirements.talismanConnected
                  ? 'Talisman Extension'
                  : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {requirements.talismanConnected && ethAddress && (
              <Badge variant="outline" className="font-mono text-xs">
                {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
              </Badge>
            )}
            <div
              className={`w-2 h-2 rounded-full ${
                requirements.talismanConnected
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Wallet Requirements */}
      <WalletRequirementsCard />

      {/* Link Action */}
      {requirements.talismanConnected && requirements.networkCorrect && (
        <Button
          onClick={handleLinkAddresses}
          disabled={isLinking || requirements.walletsLinked}
          className="w-full"
          size="lg"
        >
          {isLinking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Linking Wallets...
            </>
          ) : requirements.walletsLinked ? (
            <>
              <Link className="h-4 w-4 mr-2" />
              Wallets Already Linked
            </>
          ) : (
            <>
              <Link className="h-4 w-4 mr-2" />
              Link Wallet Addresses
            </>
          )}
        </Button>
      )}

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border">
        <strong>Why link wallets?</strong> Battles use your Polkadot address for
        NFT ownership and your Ethereum address for smart contract interactions
        via PolkaVM.
      </div>
    </div>
  );
}
