'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { ethers } from 'ethers';
import { VulpixPVMABI } from '@/lib/contract/contractABI';
import {} from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Loader2,
  Trophy,
  AlertCircle,
  Swords,
  ExternalLink,
} from 'lucide-react';
import { NFTCard } from '@/components/battle/NFTCard';
import { MoveHistoryCard } from '@/components/battle/MoveHistoryCard';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { BattleHeader } from '@/components/battle/BattleHeader';
import { CONTRACT_ADDRESS } from '@/lib/battle-utils';

declare global {
  interface Window {
    talismanEth: any;
  }
}

export default function BattlePlayPage() {
  const { id } = useParams();
  const router = useRouter();
  const { selectedAccount, getInjector } = usePolkadot();
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  const battleId = Array.isArray(id) ? id[0] : (id ?? '');

  // Queries and mutations
  const battle = useQuery(api.battle.getBattle, { battleId });
  const executeTurn = useMutation(api.battle.executeTurn);
  const updateTurnResult = useMutation(api.battle.updateTurnResult);
  const revertPendingTurn = useMutation(api.battle.revertPendingTurn);

  const isPlayer1 = selectedAccount?.address === battle?.player1Address;
  const isPlayer2 = selectedAccount?.address === battle?.player2Address;
  const isParticipant = isPlayer1 || isPlayer2;
  const isMyTurn = battle?.gameState.currentTurn === selectedAccount?.address;
  const isPending = !!battle?.gameState.pendingTurn;

  useEffect(() => {
    // Auto-connect to Talisman if not connected
    const checkTalisman = async () => {
      if (
        window.talismanEth &&
        isParticipant &&
        battle?.gameState.status === 'active'
      ) {
        try {
          const accounts = await window.talismanEth.request({
            method: 'eth_accounts',
          });
          if (accounts.length === 0) {
            setConnectionStatus('Please connect Talisman wallet');
          } else {
            setConnectionStatus('Connected');
          }
        } catch (error: any) {
          setConnectionStatus('Talisman connection error');
        }
      }
    };

    checkTalisman();
  }, [isParticipant, battle?.gameState.status]);

  const handleExecuteTurn = async () => {
    if (!selectedAccount || !battle || !isMyTurn || isPending) return;

    setIsExecutingTurn(true);

    try {
      // 1. Update UI optimistically
      await executeTurn({
        battleId,
        playerAddress: selectedAccount.address,
        action: 'attack',
      });

      // 2. Connect to blockchain
      if (!window.talismanEth) {
        throw new Error('Talisman wallet not found');
      }

      const provider = new ethers.BrowserProvider(window.talismanEth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
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

      // TODO: dont just any, use type
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
            ? '🎉 Victory! You won the battle!'
            : '💔 Defeat! Better luck next time!',
        );
      } else {
        toast.success('Turn executed successfully!');
      }
    } catch (error: any) {
      console.error('Failed to execute turn:', error);

      // Revert optimistic update
      await revertPendingTurn({
        battleId,
        error: error.message,
      });

      setConnectionStatus(`Error: ${error.message}`);
      toast.error(error.message || 'Failed to execute turn');
    } finally {
      setIsExecutingTurn(false);
    }
  };

  const connectTalisman = async () => {
    try {
      if (!window.talismanEth) {
        toast.error('Talisman wallet not found. Please install Talisman.');
        return;
      }

      await window.talismanEth.request({
        method: 'eth_requestAccounts',
      });

      setConnectionStatus('Connected to Talisman');
      toast.success('Talisman wallet connected!');
    } catch (error: any) {
      setConnectionStatus(`Connection failed: ${error.message}`);
      toast.error('Failed to connect Talisman wallet');
    }
  };

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to view this battle.
              </p>
              <Button onClick={() => router.push('/')} className="w-full">
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                Loading battle...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Spectator Mode</h2>
              <p className="text-muted-foreground mb-4">
                You are viewing this battle as a spectator.
              </p>
              <Button onClick={() => router.push('/battle')} className="w-full">
                Back to Battle Arena
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameFinished = battle.gameState.status === 'finished';
  const winner = battle.gameState.winner;
  const isWinner = winner === selectedAccount.address;

  return (
    <div className="min-h-screen bg-background">
      <BattleHeader
        title="Battle Arena"
        backHref="/battle"
        backLabel="Back to Arena"
        battleId={battleId}
        txHash={battle.creationTxHash}
        status={gameFinished ? 'finished' : battle.gameState.status}
        turnNumber={battle.gameState.turnNumber}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Battle Status */}
          {gameFinished && (
            <Card
              className={`border-2 ${isWinner ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Trophy
                    className={`h-12 w-12 mx-auto ${isWinner ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <h2 className="text-2xl font-bold">
                    {isWinner ? '🎉 Victory!' : '💔 Defeat'}
                  </h2>
                  <p className="text-muted-foreground">
                    Battle completed in {battle.gameState.turnNumber} turns •
                    {battle.finishedAt &&
                      ` ${formatDistanceToNow(battle.finishedAt, { addSuffix: true })}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Battle Arena */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player 1 */}
            <div className="space-y-4">
              <NFTCard
                title="Player 1"
                playerAddress={battle.player1Address}
                playerName={battle.player1Name}
                nftData={{
                  collection: battle.player1NFT.collection,
                  item: battle.player1NFT.item,
                  itemMetadata: { data: '' }, // We'd need to fetch this from your NFT system
                }}
                stats={battle.player1NFT.stats}
                currentHealth={battle.gameState.player1Health}
                maxHealth={battle.gameState.player1MaxHealth}
                isCurrentPlayer={isPlayer1}
                isCurrentTurn={isMyTurn && isPlayer1}
              />
            </div>

            {/* VS / Battle Controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold">VS</CardTitle>
                  <CardDescription>
                    Turn {battle.gameState.turnNumber} •{' '}
                    {gameFinished
                      ? 'Battle Complete'
                      : isPending
                        ? 'Processing...'
                        : isMyTurn
                          ? 'Your turn'
                          : "Opponent's turn"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {battle.gameState.status === 'initializing' && (
                    <div className="text-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Creating battle on blockchain...
                      </p>
                    </div>
                  )}

                  {battle.gameState.status === 'active' && !gameFinished && (
                    <div className="space-y-4">
                      {connectionStatus && (
                        <div className="p-3 bg-muted rounded-lg text-sm text-center">
                          {connectionStatus}
                        </div>
                      )}

                      {isPending && (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {battle.gameState.pendingTurn?.txHash
                              ? 'Confirming transaction...'
                              : 'Processing turn...'}
                          </p>
                          {battle.gameState.pendingTurn?.txHash && (
                            <Link
                              href={`https://blockscout-asset-hub.parity-chains-scw.parity.io/tx/${battle.gameState.pendingTurn.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline flex items-center gap-1 justify-center mt-2"
                            >
                              View Transaction{' '}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      )}

                      {isMyTurn && !isPending && (
                        <Button
                          onClick={handleExecuteTurn}
                          disabled={isExecutingTurn}
                          className="w-full"
                          size="lg"
                        >
                          {isExecutingTurn ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Executing Turn...
                            </>
                          ) : (
                            <>
                              <Swords className="h-4 w-4 mr-2" />
                              Attack!
                            </>
                          )}
                        </Button>
                      )}

                      {!isMyTurn && !isPending && (
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Waiting for opponent's move...
                          </p>
                        </div>
                      )}

                      {!window.talismanEth && (
                        <Button
                          onClick={connectTalisman}
                          variant="outline"
                          className="w-full"
                        >
                          Connect Talisman Wallet
                        </Button>
                      )}
                    </div>
                  )}

                  {gameFinished && (
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="font-semibold">Final Result</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {winner === battle.player1Address
                            ? `${battle.player1Name || 'Player 1'} wins!`
                            : `${battle.player2Name || 'Player 2'} wins!`}
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push('/battle')}
                        className="w-full"
                      >
                        Return to Battle Arena
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Move History */}
              <MoveHistoryCard moves={battle.moves} />
            </div>

            {/* Player 2 */}
            <div className="space-y-4">
              <NFTCard
                title="Player 2"
                playerAddress={battle.player2Address}
                playerName={battle.player2Name}
                nftData={{
                  collection: battle.player2NFT.collection,
                  item: battle.player2NFT.item,
                  itemMetadata: { data: '' }, // We'd need to fetch this from your NFT system
                }}
                stats={battle.player2NFT.stats}
                currentHealth={battle.gameState.player2Health}
                maxHealth={battle.gameState.player2MaxHealth}
                isCurrentPlayer={isPlayer2}
                isCurrentTurn={isMyTurn && isPlayer2}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
