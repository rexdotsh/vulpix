'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { WalletLinking } from '@/components/WalletLinking';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Swords,
  Users,
  Clock,
  Globe,
  Lock,
  Plus,
  ArrowRight,
  Trophy,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { BattleHeader } from '@/components/battle/BattleHeader';
import { formatTimeLeft, getPlayerDisplayName } from '@/lib/battle-utils';
import { PageStateCard } from '@/components/battle/PageStateCard';

export default function BattlePage() {
  const router = useRouter();
  const { selectedAccount, isReady, isInitialized } = usePolkadot();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [joinLobbyId, setJoinLobbyId] = useState('');
  const [showWalletLinking, setShowWalletLinking] = useState(false);

  // Queries
  const publicLobbies = useQuery(api.battle.getPublicLobbies);
  const activeBattles = useQuery(
    api.battle.getUserActiveBattles,
    selectedAccount ? { userAddress: selectedAccount.address } : 'skip',
  );
  const battleHistory = useQuery(
    api.battle.getUserBattleHistory,
    selectedAccount ? { userAddress: selectedAccount.address } : 'skip',
  );
  const linkStatus = useQuery(
    api.battle.getUserLinkStatus,
    selectedAccount ? { polkadotAddress: selectedAccount.address } : 'skip',
  );

  // Mutations
  const createLobby = useMutation(api.battle.createLobby);
  const joinLobby = useMutation(api.battle.joinLobby);

  const handleCreateLobby = async (isPrivate: boolean) => {
    if (!selectedAccount) return;

    // Check if wallets are linked
    if (!linkStatus?.hasLinkedEthAddress) {
      setShowWalletLinking(true);
      return;
    }

    try {
      const result = await createLobby({
        creatorAddress: selectedAccount.address,
        creatorName: selectedAccount.meta.name,
        isPrivate,
        maxWaitTime: 10 * 60 * 1000, // 10 minutes
      });

      router.push(`/battle/lobby/${result.lobbyId}`);
    } catch (error: any) {
      console.error('Failed to create lobby:', error);
      toast.error(error.message || 'Failed to create lobby');
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    if (!selectedAccount) return;

    if (!linkStatus?.hasLinkedEthAddress) {
      setShowWalletLinking(true);
      return;
    }

    try {
      await joinLobby({
        lobbyId,
        playerAddress: selectedAccount.address,
        playerName: selectedAccount.meta.name,
      });

      router.push(`/battle/lobby/${lobbyId}`);
    } catch (error: any) {
      console.error('Failed to join lobby:', error);
      toast.error(error.message || 'Failed to join lobby');
    }
  };

  const handleJoinByCode = async () => {
    if (!joinLobbyId.trim()) return;
    await handleJoinLobby(joinLobbyId.toUpperCase());
  };

  if (!isInitialized) {
    return (
      <PageStateCard
        variant="loading"
        message="Initializing wallet connection..."
      />
    );
  }

  if (!isReady) {
    return (
      <PageStateCard
        title="Wallet Required"
        message="Connect your wallet to access the battle arena"
        buttonText="Connect Wallet"
        redirectTo="/"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BattleHeader
        title="Battle Arena"
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              ⚔️ Battle Arena
            </h1>
            <p className="text-lg text-muted-foreground">
              Challenge other players to epic NFT battles powered by PolkaVM
            </p>
          </div>

          <Dialog open={showWalletLinking} onOpenChange={setShowWalletLinking}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Link Your Wallets</DialogTitle>
                <DialogDescription>
                  You need to link your Ethereum wallet to participate in
                  battles
                </DialogDescription>
              </DialogHeader>
              <WalletLinking
                onLinkingComplete={() => {
                  setShowWalletLinking(false);
                }}
              />
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                    <Plus className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Create Battle</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Start a new battle lobby
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Battle Lobby</DialogTitle>
                  <DialogDescription>
                    Choose how other players can join your battle
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Button
                    onClick={() => handleCreateLobby(false)}
                    className="w-full h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      <span className="font-semibold">Public Battle</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Anyone can join from the lobby browser
                    </p>
                  </Button>
                  <Button
                    onClick={() => handleCreateLobby(true)}
                    className="w-full h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      <span className="font-semibold">Private Battle</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share the lobby code with friends
                    </p>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                <div className="space-y-3 w-full">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-8 w-8 text-primary" />
                    <h3 className="font-semibold">Join by Code</h3>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter lobby code"
                      value={joinLobbyId}
                      onChange={(e) =>
                        setJoinLobbyId(e.target.value.toUpperCase())
                      }
                      className="text-center"
                    />
                    <Button
                      onClick={handleJoinByCode}
                      disabled={
                        !joinLobbyId.trim() || !linkStatus?.hasLinkedEthAddress
                      }
                      className="w-full"
                      size="sm"
                    >
                      Join Battle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                <Activity className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Quick Stats</h3>
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Active: {activeBattles?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Completed: {battleHistory?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="lobbies" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="lobbies">Public Lobbies</TabsTrigger>
              <TabsTrigger value="active">Active Battles</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Public Lobbies */}
            <TabsContent value="lobbies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Public Battle Lobbies
                  </CardTitle>
                  <CardDescription>
                    Join an open battle or create your own
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!publicLobbies ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-muted animate-pulse rounded-lg"
                        />
                      ))}
                    </div>
                  ) : publicLobbies.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Public Lobbies</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to create a public battle!
                      </p>
                      <Button onClick={() => handleCreateLobby(false)}>
                        Create Public Battle
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {publicLobbies.map((lobby) => (
                        <div
                          key={lobby._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {lobby.creatorName || 'Anonymous'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {lobby.lobbyId}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Created{' '}
                                {formatDistanceToNow(lobby.createdAt, {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="text-sm">
                                <Clock className="h-4 w-4 inline mr-1" />
                                {formatTimeLeft(lobby.expiresAt)}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleJoinLobby(lobby.lobbyId)}
                              size="sm"
                            >
                              Join
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Battles */}
            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Swords className="h-5 w-5" />
                    Active Battles
                  </CardTitle>
                  <CardDescription>
                    Continue your ongoing battles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!activeBattles ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-muted animate-pulse rounded-lg"
                        />
                      ))}
                    </div>
                  ) : activeBattles.length === 0 ? (
                    <div className="text-center py-8">
                      <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Active Battles</h3>
                      <p className="text-muted-foreground">
                        Start a new battle to see it here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBattles.map((battle) => {
                        const isMyTurn =
                          battle.gameState.currentTurn ===
                          selectedAccount?.address;
                        const opponent =
                          battle.player1Address === selectedAccount?.address
                            ? getPlayerDisplayName(
                                battle.player2Address,
                                battle.player2Name,
                              )
                            : getPlayerDisplayName(
                                battle.player1Address,
                                battle.player1Name,
                              );

                        return (
                          <div
                            key={battle._id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isMyTurn
                                    ? 'bg-green-500 animate-pulse'
                                    : 'bg-yellow-500'
                                }`}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    vs {opponent}
                                  </span>
                                  <Badge
                                    variant={isMyTurn ? 'default' : 'secondary'}
                                  >
                                    {isMyTurn ? 'Your Turn' : 'Waiting'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Turn {battle.gameState.turnNumber} •{' '}
                                  {formatDistanceToNow(battle.lastActivity, {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right text-sm">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                                  <span>{battle.gameState.player1Health}</span>
                                  <span className="text-muted-foreground">
                                    vs
                                  </span>
                                  <span>{battle.gameState.player2Health}</span>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                </div>
                              </div>
                              <Button asChild size="sm">
                                <Link href={`/battle/play/${battle.battleId}`}>
                                  Continue
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Battle History */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Battle History
                  </CardTitle>
                  <CardDescription>
                    Your completed battles and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!battleHistory ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-muted animate-pulse rounded-lg"
                        />
                      ))}
                    </div>
                  ) : battleHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Battle History</h3>
                      <p className="text-muted-foreground">
                        Complete your first battle to see results here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {battleHistory.map((battle) => {
                        const won =
                          battle.gameState.winner === selectedAccount?.address;
                        const opponent =
                          battle.player1Address === selectedAccount?.address
                            ? getPlayerDisplayName(
                                battle.player2Address,
                                battle.player2Name,
                              )
                            : getPlayerDisplayName(
                                battle.player1Address,
                                battle.player1Name,
                              );

                        return (
                          <div
                            key={battle._id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  won ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    vs {opponent}
                                  </span>
                                  <Badge
                                    variant={won ? 'default' : 'destructive'}
                                  >
                                    {won ? 'Victory' : 'Defeat'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {battle.gameState.turnNumber} turns •{' '}
                                  {battle.finishedAt
                                    ? formatDistanceToNow(battle.finishedAt, {
                                        addSuffix: true,
                                      })
                                    : 'Pending'}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/battle/play/${battle.battleId}`}>
                                View Replay
                              </Link>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
