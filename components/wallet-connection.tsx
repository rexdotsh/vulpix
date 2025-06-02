'use client';

import { ChevronDown, Wallet, WifiOff, Wifi, User } from 'lucide-react';
import { usePolkadot } from '@/lib/PolkadotProvider';
import { useAssetHub } from '@/lib/AssetHubProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WalletConnection() {
  const {
    isReady,
    isConnecting,
    error,
    accounts,
    selectedAccount,
    selectedAccountIndex,
    enableExtensions,
    selectAccount,
    disconnectExtensions,
  } = usePolkadot();

  const { isInitialized, isInitializing, error: assetHubError } = useAssetHub();

  if (!isReady) {
    return (
      <div className="absolute top-4 right-4">
        <Button
          onClick={enableExtensions}
          disabled={isConnecting}
          variant="outline"
          size="sm"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {selectedAccount?.meta.name ||
                selectedAccount?.address.slice(0, 6)}
            </span>
            <Badge
              variant={isInitialized ? 'default' : 'secondary'}
              className="h-4 px-1 text-xs"
            >
              {isInitializing ? '...' : isInitialized ? '✓' : '×'}
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>
            <div className="flex items-center justify-between">
              <span>Wallet Connected</span>
              <div className="flex items-center gap-1">
                {isInitializing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
                    <span className="text-xs text-gray-600">Connecting...</span>
                  </>
                ) : isInitialized ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">AssetHub</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="px-4 py-3 space-y-2">
            <div className="font-medium text-sm">
              {selectedAccount?.meta.name ||
                `Account ${selectedAccountIndex + 1}`}
            </div>
            <div className="text-xs text-gray-500 font-mono break-all leading-relaxed">
              {selectedAccount?.address}
            </div>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={disconnectExtensions}
            className="text-red-600"
          >
            <WifiOff className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
