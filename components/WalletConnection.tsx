'use client';

import { ChevronDown, Wallet, WifiOff, Wifi, User, Check } from 'lucide-react';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';
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
    accounts,
    selectedAccount,
    selectedAccountIndex,
    enableExtensions,
    selectAccount,
    disconnectExtensions,
  } = usePolkadot();

  const { isInitialized, isInitializing } = useAssetHub();

  if (!isReady) {
    return (
      <Button
        onClick={enableExtensions}
        disabled={isConnecting}
        variant="outline"
        size="sm"
      >
        <Wallet className="h-4 w-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    );
  }

  return (
    <div>
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
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="pb-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Wallet Connected</span>
              <div className="flex items-center gap-1">
                {isInitializing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                    <span className="text-xs text-muted-foreground">
                      Connecting...
                    </span>
                  </>
                ) : isInitialized ? (
                  <>
                    <Wifi className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary font-medium">
                      AssetHub
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-destructive font-medium">
                      Disconnected
                    </span>
                  </>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="px-3 py-3 bg-muted/50 border-l-4 border-primary mx-2 my-2 rounded-r">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-sm text-foreground">
                Current Account
              </div>
              <Badge variant="outline" className="text-xs">
                {selectedAccountIndex + 1} of {accounts.length}
              </Badge>
            </div>
            <div className="font-semibold text-sm mb-1">
              {selectedAccount?.meta.name ||
                `Account ${selectedAccountIndex + 1}`}
            </div>
            <div className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
              {selectedAccount?.address}
            </div>
          </div>

          {accounts.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Switch Account ({accounts.length} available)
              </DropdownMenuLabel>

              <div className="max-h-48 overflow-y-auto">
                {accounts.map((account, index) => (
                  <DropdownMenuItem
                    key={account.address}
                    onClick={() => selectAccount(index)}
                    className="px-3 py-3 cursor-pointer hover:bg-accent focus:bg-accent"
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-sm truncate">
                            {account.meta.name || `Account ${index + 1}`}
                          </div>
                          {index === selectedAccountIndex && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {account.address}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={disconnectExtensions}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
          >
            <WifiOff className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
