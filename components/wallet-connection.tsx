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
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="pb-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Wallet Connected</span>
              <div className="flex items-center gap-1">
                {isInitializing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
                    <span className="text-xs text-gray-600">Connecting...</span>
                  </>
                ) : isInitialized ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      AssetHub
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500 font-medium">
                      Disconnected
                    </span>
                  </>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="px-3 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-l-4 border-blue-500 mx-2 my-2 rounded-r">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
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
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all leading-relaxed">
              {selectedAccount?.address}
            </div>
          </div>

          {accounts.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">
                Switch Account ({accounts.length} available)
              </DropdownMenuLabel>

              <div className="max-h-48 overflow-y-auto">
                {accounts.map((account, index) => (
                  <DropdownMenuItem
                    key={account.address}
                    onClick={() => selectAccount(index)}
                    className="px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:bg-gray-50 dark:focus:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-sm truncate">
                            {account.meta.name || `Account ${index + 1}`}
                          </div>
                          {index === selectedAccountIndex && (
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
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
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20"
          >
            <WifiOff className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
