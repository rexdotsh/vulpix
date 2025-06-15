'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { ethers } from 'ethers';
import { VulpixPVMABI } from '@/lib/contract/contractABI';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, AlertCircle } from 'lucide-react';
import { PageStateCard } from '@/components/battle/PageStateCard';
import { useTalismanWallet } from '@/hooks/useTalismanWallet';
import { toast } from 'sonner';
import { env } from '@/env';
import { getNFTTypeName } from '@/lib/battle-utils';
import { decodeHexMetadata, getIpfsImageUrl } from '@/lib/utils';
import { generateMoves, type BattleMove } from '@/lib/battle-moves';
import { BattlePlayerPanel } from '@/components/battle/BattlePlayerPanel';
import { BattleArena } from '@/components/battle/BattleArena';
import { BattleMovesPanel } from '@/components/battle/BattleMovesPanel';
import { BattleLogPanel } from '@/components/battle/BattleLogPanel';

export default function BattlePlayPage() {
  const { id } = useParams();
  const { selectedAccount, isInitialized } = usePolkadot();
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [selectedMove, setSelectedMove] = useState<BattleMove | null>(null);
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);
  const {
    isConnected: talismanConnected,
    connectionStatus,
    setConnectionStatus,
    connectWallet,
  } = useTalismanWallet();

  const battleId = Array.isArray(id) ? id[0] : (id ?? '');

  const battleData = useQuery(api.battle.getBattleWithNFTData, { battleId });
  const battle = battleData
    ? {
        ...battleData,
        player1NFT: battleData.player1NFT,
        player2NFT: battleData.player2NFT,
      }
    : null;
  const executeTurn = useMutation(api.battle.executeTurn);
  const updateTurnResult = useMutation(api.battle.updateTurnResult);
  const revertPendingTurn = useMutation(api.battle.revertPendingTurn);

  const player1Profile = useQuery(
    api.users.getUser,
    battle ? { address: battle.player1Address } : 'skip',
  );

  const player2Profile = useQuery(
    api.users.getUser,
    battle ? { address: battle.player2Address } : 'skip',
  );

  const isPlayer1 = selectedAccount?.address === battle?.player1Address;
  const isPlayer2 = selectedAccount?.address === battle?.player2Address;
  const isParticipant = isPlayer1 || isPlayer2;
  const isMyTurn = battle?.gameState.currentTurn === selectedAccount?.address;
  const isPending = !!battle?.gameState.pendingTurn;

  useEffect(() => {
    const checkScreenSize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      // - Left panel (BattlePlayerPanel): ~320px
      // - Right panel (BattleLogPanel): ~384px (w-96)
      // - Center area minimum: ~400px for arena + moves
      // - Margins/padding: ~400px
      const minRequiredWidth = 320 + 384 + 400 + 400; // 1504px
      const minRequiredHeight = 900;
      setIsScreenTooSmall(
        viewportWidth < minRequiredWidth || viewportHeight < minRequiredHeight,
      );
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleExecuteTurn = async () => {
    if (!selectedAccount || !battle || !isMyTurn || isPending || !selectedMove)
      return;

    setIsExecutingTurn(true);

    try {
      // 1. Update UI optimistically
      await executeTurn({
        battleId,
        playerAddress: selectedAccount.address,
        action: selectedMove.name,
      });

      // 2. Connect to blockchain
      if (!window.talismanEth) {
        throw new Error('Talisman wallet not found');
      }

      const provider = new ethers.BrowserProvider(window.talismanEth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        VulpixPVMABI,
        signer,
      );

      // 3. Execute turn on smart contract
      setConnectionStatus('Executing turn on blockchain...');
      const tx = await contract.executeTurn(battle.contractBattleId);

      setConnectionStatus('Waiting for confirmation...');
      const receipt = await tx.wait();

      // 4. Parse transaction result
      const turnEvents = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(
          (event: any) =>
            event?.name === 'TurnExecuted' || event?.name === 'BattleEnded',
        );

      if (turnEvents.length === 0) {
        throw new Error('No turn events found in transaction');
      }

      // 5. Get updated battle state from contract
      const contractBattleState = await contract.getBattleState(
        battle.contractBattleId,
      );

      const turnExecutedEvent = turnEvents.find(
        (e: any) => e.name === 'TurnExecuted',
      );
      const battleEndedEvent = turnEvents.find(
        (e: any) => e.name === 'BattleEnded',
      );

      // 6. Update Convex with results
      await updateTurnResult({
        battleId,
        txHash: receipt.hash,
        newGameState: {
          currentTurn: contractBattleState.currentPlayerTurn,
          player1Health: Number(contractBattleState.player1CurrentHealth),
          player2Health: Number(contractBattleState.player2CurrentHealth),
          turnNumber: Number(contractBattleState.turnCount),
          isFinished: contractBattleState.isOver,
          winner:
            contractBattleState.winner !== ethers.ZeroAddress
              ? contractBattleState.winner
              : undefined,
        },
        moveData: {
          damage: turnExecutedEvent
            ? Number(turnExecutedEvent.args.damageDealt)
            : undefined,
          wasCritical: turnExecutedEvent
            ? turnExecutedEvent.args.wasCriticalHit
            : undefined,
        },
      });

      setConnectionStatus('Turn completed successfully!');

      if (battleEndedEvent) {
        toast.success(
          contractBattleState.winner === selectedAccount.address
            ? '🎉 Victory! You won the battle and earned 5 credits!'
            : '💔 Defeat! Better luck next time!',
        );
      } else {
        toast.success('Turn executed successfully!');
      }

      // Clear selected move after successful execution
      setSelectedMove(null);
    } catch (error: unknown) {
      console.error('Failed to execute turn:', error);

      // Revert optimistic update
      await revertPendingTurn({
        battleId,
        error: error instanceof Error ? error.message : String(error),
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to execute turn';
      setConnectionStatus(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsExecutingTurn(false);
    }
  };

  if (!isInitialized) {
    return (
      <PageStateCard
        variant="loading"
        message="Initializing wallet connection..."
      />
    );
  }

  if (!selectedAccount) {
    return (
      <PageStateCard
        variant="walletConnect"
        message="Please connect your wallet to view this battle."
      />
    );
  }

  if (isScreenTooSmall) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Screen Space Insufficient</h2>
            <p className="text-muted-foreground">
              The Battle Arena needs more screen space to display all battle
              panels properly. Try zooming out, maximizing your window, or using
              a larger screen.
            </p>
            <div className="space-y-2 text-xs">
              <div className="text-muted-foreground">
                Current: {typeof window !== 'undefined' ? window.innerWidth : 0}
                x{typeof window !== 'undefined' ? window.innerHeight : 0}px
              </div>
              <div className="font-medium">
                Recommended: 1504x600px or larger
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!battle) {
    return <PageStateCard variant="loading" message="Loading battle..." />;
  }

  if (!isParticipant) {
    return (
      <PageStateCard
        icon={<AlertCircle className="size-12 text-yellow-500" />}
        title="Spectator Mode"
        message="You are viewing this battle as a spectator."
        buttonText="Back to Battle Arena"
        redirectTo="/battle"
      />
    );
  }

  const gameFinished = battle.gameState.status === 'finished';
  const winner = battle.gameState.winner;
  const isWinner = winner === selectedAccount.address;

  const player1 = {
    address: battle.player1Address,
    name: battle.player1Name,
    nft: battle.player1NFT,
    nftData: battle.player1NFTData,
    health: battle.gameState.player1Health,
    maxHealth: battle.gameState.player1MaxHealth,
    isCurrentPlayer: isPlayer1,
    profile: player1Profile,
  };

  const player2 = {
    address: battle.player2Address,
    name: battle.player2Name,
    nft: battle.player2NFT,
    nftData: battle.player2NFTData,
    health: battle.gameState.player2Health,
    maxHealth: battle.gameState.player2MaxHealth,
    isCurrentPlayer: isPlayer2,
    profile: player2Profile,
  };

  const currentPlayer = isPlayer1 ? player1 : player2;
  const opponent = isPlayer1 ? player2 : player1;

  const currentPlayerMetadata = decodeHexMetadata(
    currentPlayer.nftData?.itemMetadata?.data || '',
  );
  const opponentMetadata = decodeHexMetadata(
    opponent.nftData?.itemMetadata?.data || '',
  );

  const currentPlayerImage = getIpfsImageUrl(currentPlayerMetadata);
  const opponentImage = getIpfsImageUrl(opponentMetadata);

  const currentPlayerNFTName =
    currentPlayerMetadata?.name ||
    `${getNFTTypeName(currentPlayer.nft.stats.nftType)} #${currentPlayer.nft.item}`;
  const opponentNFTName =
    opponentMetadata?.name ||
    `${getNFTTypeName(opponent.nft.stats.nftType)} #${opponent.nft.item}`;

  const availableMoves = generateMoves({
    stats: currentPlayer.nft.stats,
    moves: currentPlayer.nftData?.moves,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {gameFinished && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center pt-8">
          <Card
            className={`border-2 ${
              isWinner
                ? 'bg-green-500/20 border-green-500'
                : 'bg-red-500/20 border-red-500'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="size-6" />
                <span
                  className={`text-xl font-bold ${
                    isWinner ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {isWinner ? '🎉 Victory!' : '💔 Defeat'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex h-screen">
        <BattlePlayerPanel
          player={currentPlayer}
          nftName={currentPlayerNFTName}
          isMyTurn={isMyTurn}
          roomCode={battleId}
        />

        <div className="flex-1 flex flex-col">
          <BattleArena
            currentPlayer={currentPlayer}
            opponent={opponent}
            currentPlayerImage={currentPlayerImage}
            opponentImage={opponentImage}
            currentPlayerNFTName={currentPlayerNFTName}
            opponentNFTName={opponentNFTName}
            currentPlayerNFTType={currentPlayer.nft.stats.nftType}
            opponentNFTType={opponent.nft.stats.nftType}
            turnNumber={battle.gameState.turnNumber}
          />

          <BattleMovesPanel
            moves={availableMoves}
            selectedMove={selectedMove}
            onMoveSelect={setSelectedMove}
            onExecuteTurn={handleExecuteTurn}
            isMyTurn={isMyTurn}
            isPending={isPending}
            gameFinished={gameFinished}
            isExecutingTurn={isExecutingTurn}
            connectionStatus={connectionStatus}
            pendingTxHash={battle.gameState.pendingTurn?.txHash}
          />
        </div>

        <BattleLogPanel
          moves={battle.moves}
          gameStatus={battle.gameState.status}
          currentTurn={battle.gameState.currentTurn}
          turnNumber={battle.gameState.turnNumber}
          player1Address={battle.player1Address}
          player2Address={battle.player2Address}
          player1Name={battle.player1Name}
          player2Name={battle.player2Name}
        />
      </div>
    </div>
  );
}
