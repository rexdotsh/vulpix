'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTalismanWallet } from '@/hooks/useTalismanWallet';

interface TalismanConnectionCardProps {
  title?: string;
  description?: string;
  showNetworkSwitch?: boolean;
  onConnected?: () => void;
}

export function TalismanConnectionCard({
  title = 'Connect Talisman Wallet',
  description = 'Connect your Talisman wallet to interact with the blockchain',
  showNetworkSwitch = true,
  onConnected,
}: TalismanConnectionCardProps) {
  const {
    isConnected,
    connectionStatus,
    connectWallet,
    switchToAssetHubNetwork,
  } = useTalismanWallet();

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success && onConnected) {
      onConnected();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus && (
          <div className="p-3 bg-muted rounded-lg text-sm text-center">
            {connectionStatus}
          </div>
        )}

        {!isConnected && (
          <Button onClick={handleConnect} className="w-full">
            Connect Talisman Wallet
          </Button>
        )}

        {isConnected && showNetworkSwitch && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Switch to AssetHub network for battle transactions
            </p>
            <Button
              onClick={switchToAssetHubNetwork}
              variant="outline"
              className="w-full"
            >
              Switch to AssetHub Network
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
