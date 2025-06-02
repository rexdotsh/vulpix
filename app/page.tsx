'use client';

import Link from 'next/link';
import { usePolkadot } from '@/lib/PolkadotProvider';
import { useAssetHub } from '@/lib/AssetHubProvider';

export default function Page() {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-center">AssetHub NFT Manager</h1>

        {!isReady ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Connect your Polkadot wallet to get started
            </p>
            <button
              type="button"
              onClick={enableExtensions}
              disabled={isConnecting}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-green-600 font-medium">✓ Wallet Connected</p>
              <p className="text-sm text-gray-600">
                Connected as:{' '}
                {selectedAccount?.meta.name ||
                  selectedAccount?.address.slice(0, 8)}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              {isInitializing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  <span className="text-sm text-gray-600">
                    Connecting to AssetHub...
                  </span>
                </div>
              ) : isInitialized ? (
                <p className="text-green-600 text-sm font-medium">
                  ✓ AssetHub Connected
                </p>
              ) : assetHubError ? (
                <p className="text-red-500 text-sm">
                  ⚠ AssetHub Connection Failed
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="account-select"
                className="block text-sm font-medium text-gray-700"
              >
                Select Account:
              </label>
              <select
                id="account-select"
                value={selectedAccountIndex}
                onChange={(e) => selectAccount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map((account, index) => (
                  <option key={account.address} value={index}>
                    {account.meta.name || account.address.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard"
                className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  isInitialized
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!isInitialized) {
                    e.preventDefault();
                  }
                }}
              >
                {isInitializing ? 'Connecting to AssetHub...' : 'View My NFTs'}
              </Link>

              <button
                type="button"
                onClick={disconnectExtensions}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>

            {assetHubError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                AssetHub Error: {assetHubError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
