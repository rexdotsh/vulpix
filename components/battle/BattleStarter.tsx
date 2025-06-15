import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useWalletRequirements } from '@/lib/hooks/useWalletRequirements';
import { WalletRequirementsCard } from './WalletRequirementsCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Swords, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { VulpixPVMABI } from '@/lib/contract/contractABI';
import { env } from '@/env';
import { ASSET_HUB_CHAIN_ID } from '@/lib/constants/chains';

interface BattleStarterProps {
  lobby: any;
  isCreator: boolean;
  playersEthAddresses: any;
  onWalletLinking: () => void;
}

export function BattleStarter({
  lobby,
  isCreator,
  playersEthAddresses,
  onWalletLinking,
}: BattleStarterProps) {
  const router = useRouter();
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  const { requirements, allRequirementsMet, selectedAccount } =
    useWalletRequirements();

  const startBattleFromLobby = useMutation(api.lobby.startBattleFromLobby);
  const updateBattleContractInfo = useMutation(
    api.battle.updateBattleContractInfo,
  );

  const bothPlayersReady =
    lobby.creatorNFT?.isReady && lobby.joinerNFT?.isReady;
  const canStartBattle =
    bothPlayersReady && isCreator && allRequirementsMet && playersEthAddresses;

  const handleStartBattle = async () => {
    if (!selectedAccount || !lobby || !allRequirementsMet) {
      if (!requirements.walletsLinked) {
        onWalletLinking();
        return;
      }
      return;
    }

    setIsStartingBattle(true);
    try {
      // Check network
      const provider = new ethers.BrowserProvider(window.talismanEth);
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(ASSET_HUB_CHAIN_ID)) {
        toast.error('Please switch to AssetHub network');
        return;
      }

      // Start battle in Convex
      const battleData = await startBattleFromLobby({
        lobbyId: lobby.lobbyId,
        initiatorAddress: selectedAccount.address,
      });

      // Create contract battle
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        VulpixPVMABI,
        signer,
      );

      const tx = await contract.createBattle(
        playersEthAddresses.joinerEthAddress,
        {
          attack: battleData.player1Stats.attack,
          defense: battleData.player1Stats.defense,
          intelligence: battleData.player1Stats.intelligence,
          luck: battleData.player1Stats.luck,
          speed: battleData.player1Stats.speed,
          strength: battleData.player1Stats.strength,
          nftType: battleData.player1Stats.nftType,
        },
        {
          attack: battleData.player2Stats.attack,
          defense: battleData.player2Stats.defense,
          intelligence: battleData.player2Stats.intelligence,
          luck: battleData.player2Stats.luck,
          speed: battleData.player2Stats.speed,
          strength: battleData.player2Stats.strength,
          nftType: battleData.player2Stats.nftType,
        },
        battleData.player1Stats.maxHealth,
        battleData.player2Stats.maxHealth,
      );

      toast.info('Battle creation transaction sent...');
      const receipt = await tx.wait();

      // Get battle ID from contract event
      const battleCreatedEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'BattleCreated');

      if (!battleCreatedEvent) {
        throw new Error('Failed to get battle ID from contract');
      }

      const contractBattleId = battleCreatedEvent.args.battleId.toString();
      await updateBattleContractInfo({
        battleId: battleData.battleId,
        contractBattleId,
        creationTxHash: receipt.hash,
      });

      toast.success('Battle created successfully!');
      router.push(`/battle/play/${battleData.battleId}`);
    } catch (error: any) {
      console.error('Failed to start battle:', error);
      toast.error(error.message || 'Failed to start battle');
    } finally {
      setIsStartingBattle(false);
    }
  };

  const getButtonContent = () => {
    if (isStartingBattle) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Creating Battle...
        </>
      );
    }

    if (!bothPlayersReady) return 'Waiting for Players to Ready Up';
    if (!requirements.talismanConnected) return 'Connect Talisman Wallet First';
    if (!requirements.networkCorrect) return 'Switch to AssetHub Network';
    if (!requirements.walletsLinked) return 'Link Ethereum Wallet First';
    if (!playersEthAddresses) return 'Waiting for Ethereum Address Linking';

    return (
      <>
        <Swords className="h-4 w-4 mr-2" />
        Start Battle!
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Battle</CardTitle>
        <CardDescription>
          Both players must be ready before the battle can begin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Requirements for all players */}
        <WalletRequirementsCard onLinkWallet={onWalletLinking} compact />

        {/* Ready status for joiners */}
        {!isCreator && allRequirementsMet && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Your wallet is ready for battle! Waiting for the lobby creator
                to start.
              </span>
            </div>
          </div>
        )}

        {/* Battle readiness indicator */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">Battle Readiness</p>
            <p className="text-sm text-muted-foreground">
              {bothPlayersReady
                ? 'Both players ready!'
                : 'Waiting for all players to be ready'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${lobby.creatorNFT?.isReady ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <span className="text-sm">P1</span>
            <div
              className={`w-2 h-2 rounded-full ${lobby.joinerNFT?.isReady ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <span className="text-sm">P2</span>
          </div>
        </div>

        {/* Battle start button */}
        {isCreator ? (
          <Button
            onClick={handleStartBattle}
            disabled={!canStartBattle || isStartingBattle}
            className="w-full"
            size="lg"
          >
            {getButtonContent()}
          </Button>
        ) : (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Waiting for lobby creator to start the battle...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
