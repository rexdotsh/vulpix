import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { useTalismanWallet } from '@/hooks/useTalismanWallet';

export function useWalletRequirements() {
  const { selectedAccount } = usePolkadot();
  const {
    isConnected: talismanConnected,
    ethAddress,
    isOnAssetHub,
  } = useTalismanWallet();

  const linkStatus = useQuery(
    api.battle.getUserLinkStatus,
    selectedAccount ? { polkadotAddress: selectedAccount.address } : 'skip',
  );

  const requirements = {
    polkadotConnected: !!selectedAccount,
    talismanConnected,
    networkCorrect: isOnAssetHub,
    walletsLinked: !!linkStatus?.hasLinkedEthAddress,
    talismanInstalled: !!window.talismanEth,
  };

  const allRequirementsMet = Object.values(requirements).every(Boolean);

  return {
    requirements,
    allRequirementsMet,
    ethAddress,
    selectedAccount,
    linkStatus,
  };
}
