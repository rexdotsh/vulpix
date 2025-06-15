'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
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
import {
  Users,
  Copy,
  Check,
  Loader2,
  Swords,
  AlertCircle,
  ExternalLink,
  ImageIcon,
  CheckCircle,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageStateCard } from '@/components/battle/PageStateCard';
import { NFTSelector } from '@/components/battle/NFTSelector';
import { useTalismanWallet } from '@/hooks/useTalismanWallet';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNFTs } from '@/hooks/useNFTs';
import { ethers } from 'ethers';
import { VulpixPVMABI } from '@/lib/contract/contractABI';
import { env } from '@/env';
import { WalletLinking } from '@/components/WalletLinking';
import { ASSET_HUB_CHAIN_ID } from '@/lib/constants/chains';
import {} from '@/lib/utils';
import {} from '@/lib/battle-utils';

declare global {
  interface Window {
    talismanEth: any;
  }
}

interface LobbyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const { selectedAccount, isInitialized } = usePolkadot();
  const { nfts } = useNFTs();

  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  const [showWalletLinking, setShowWalletLinking] = useState(false);

  const {
    isConnected: talismanConnected,
    ethAddress,
    isOnAssetHub,
    isCheckingNetwork,
    isSwitchingNetwork,
    connectWallet,
    switchToAssetHubNetwork,
  } = useTalismanWallet();

  const lobbyId = Array.isArray(id) ? id[0] : (id ?? '');
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/battle/lobby/${lobbyId}`
      : '';

  const lobby = useQuery(api.lobby.getLobby, { lobbyId });
  const linkStatus = useQuery(
    api.battle.getUserLinkStatus,
    selectedAccount ? { polkadotAddress: selectedAccount.address } : 'skip',
  );
  const playersEthAddresses = useQuery(
    api.lobby.getBattlePlayersEthAddresses,
    lobby?.joinedPlayerAddress ? { lobbyId } : 'skip',
  );
  const battleIdFromLobby = useQuery(
    api.lobby.getBattleFromLobby,
    lobby?.status === 'started' ? { lobbyId } : 'skip',
  );
  const updateLobbyNFT = useMutation(api.lobby.updateLobbyNFT);
  const startBattleFromLobby = useMutation(api.lobby.startBattleFromLobby);
  const updateBattleContractInfo = useMutation(
    api.battle.updateBattleContractInfo,
  );
  const joinLobby = useMutation(api.lobby.joinLobby);

  const isCreator = selectedAccount?.address === lobby?.creatorAddress;
  const isJoiner = selectedAccount?.address === lobby?.joinedPlayerAddress;
  const isInLobby = isCreator || isJoiner;

  useEffect(() => {
    if (lobby && selectedAccount && !isInLobby && lobby.status === 'waiting') {
      joinLobby({
        lobbyId,
        playerAddress: selectedAccount.address,
        playerName: selectedAccount.meta.name,
      }).catch(console.error);
    }
  }, [lobby, selectedAccount, isInLobby]);

  useEffect(() => {
    if (lobby?.status === 'started' && battleIdFromLobby) {
      router.push(`/battle/play/${battleIdFromLobby}`);
    }
  }, [lobby?.status, battleIdFromLobby, router]);

  const handleNFTSelect = async (nft: any) => {
    if (!selectedAccount || !isInLobby) return;

    setSelectedNFT(nft);

    try {
      await updateLobbyNFT({
        lobbyId,
        playerAddress: selectedAccount.address,
        nftCollection: nft.collection,
        nftItem: nft.item,
        isReady: false, // Reset ready state when changing NFT
      });
      setIsReady(false);
    } catch (error) {
      console.error('Failed to update NFT:', error);
      toast.error('Failed to select NFT');
    }
  };

  const handleReadyToggle = async () => {
    if (!selectedAccount || !selectedNFT || !isInLobby) return;

    if (!talismanConnected) {
      toast.error('Please connect your Talisman wallet first');
      return;
    }

    if (!isOnAssetHub) {
      toast.error('Please switch to AssetHub network first');
      return;
    }

    if (!linkStatus?.hasLinkedEthAddress) {
      toast.error('Please link your Ethereum wallet first');
      setShowWalletLinking(true);
      return;
    }

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    try {
      await updateLobbyNFT({
        lobbyId,
        playerAddress: selectedAccount.address,
        nftCollection: selectedNFT.collection,
        nftItem: selectedNFT.item,
        isReady: newReadyState,
      });
    } catch (error) {
      console.error('Failed to update ready state:', error);
      setIsReady(!newReadyState); // Revert on error
      toast.error('Failed to update ready state');
    }
  };

  const handleStartBattle = async () => {
    if (!selectedAccount || !lobby) return;

    if (!linkStatus?.hasLinkedEthAddress) {
      setShowWalletLinking(true);
      return;
    }

    if (!talismanConnected || !playersEthAddresses) return;

    setIsStartingBattle(true);

    try {
      // 1. Check if user is on AssetHub network FIRST
      const provider = new ethers.BrowserProvider(window.talismanEth);
      const network = await provider.getNetwork();

      if (network.chainId !== BigInt(ASSET_HUB_CHAIN_ID)) {
        toast.error(
          'Please switch to AssetHub network before starting the battle',
        );
        setIsStartingBattle(false);
        return;
      }

      // 2. Start battle in Convex (generates battle ID and stats)
      const battleData = await startBattleFromLobby({
        lobbyId,
        initiatorAddress: selectedAccount.address,
      });

      // 3. Get signer and create contract
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        VulpixPVMABI,
        signer,
      );

      // 4. Create battle on smart contract
      const tx = await contract.createBattle(
        playersEthAddresses.joinerEthAddress, // player2 ETH address
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

      // 5. Wait for confirmation and get battle ID
      const receipt = await tx.wait();

      // Parse battle created event to get contract battle ID
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

      // 6. Update battle with contract info
      await updateBattleContractInfo({
        battleId: battleData.battleId,
        contractBattleId,
        creationTxHash: receipt.hash,
      });

      toast.success('Battle created successfully!');

      // 7. Redirect to battle
      router.push(`/battle/play/${battleData.battleId}`);
    } catch (error: any) {
      console.error('Failed to start battle:', error);
      toast.error(error.message || 'Failed to start battle');
    } finally {
      setIsStartingBattle(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('Lobby link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
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
        message="Please connect your wallet to join this lobby."
      />
    );
  }

  if (!lobby) {
    return <PageStateCard variant="loading" message="Loading lobby..." />;
  }

  if (lobby.status === 'expired' || lobby.status === 'cancelled') {
    return (
      <PageStateCard
        title={`Lobby ${lobby.status}`}
        message="This lobby is no longer available."
        buttonText="Back to Battle Arena"
        redirectTo="/battle"
      />
    );
  }

  if (lobby.status === 'started') {
    return (
      <PageStateCard
        variant="loading"
        message="Battle is starting! Redirecting to battle arena..."
      />
    );
  }

  const bothPlayersReady =
    lobby.creatorNFT?.isReady && lobby.joinerNFT?.isReady;
  const canStartBattle =
    bothPlayersReady &&
    isCreator &&
    talismanConnected &&
    isOnAssetHub &&
    playersEthAddresses &&
    linkStatus?.hasLinkedEthAddress;

  // Check if current player can mark themselves as ready
  const canBeReady =
    talismanConnected && isOnAssetHub && linkStatus?.hasLinkedEthAddress;

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Battle Lobby</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lobby ID: {lobbyId}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/battle">← Back to Arena</Link>
          </Button>
        </div>
      </div>

      <Dialog open={showWalletLinking} onOpenChange={setShowWalletLinking}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Your Wallets</DialogTitle>
            <DialogDescription>
              You need to link your Ethereum wallet to start battles
            </DialogDescription>
          </DialogHeader>
          <WalletLinking
            onLinkingComplete={() => {
              setShowWalletLinking(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Enhanced Lobby Status Card */}
          <Card className="border-2 bg-gradient-to-r from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Swords className="h-5 w-5 text-primary" />
                  </div>
                  <span>Lobby Status</span>
                </div>
                <Badge
                  variant={
                    lobby.status === 'ready' ||
                    (lobby.status as string) === 'started'
                      ? 'default'
                      : 'secondary'
                  }
                  className="text-sm px-3 py-1"
                >
                  {lobby.status === 'waiting'
                    ? 'Waiting for Players'
                    : lobby.status === 'ready'
                      ? 'Ready to Start'
                      : lobby.status === 'started'
                        ? 'Battle Starting...'
                        : lobby.status}
                </Badge>
              </CardTitle>
              <CardDescription className="text-base">
                {lobby.settings.isPrivate ? 'Private lobby' : 'Public lobby'} •
                Created{' '}
                {formatDistanceToNow(lobby.createdAt, { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <div className="font-medium text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Players: {lobby.joinedPlayerAddress ? '2/2' : '1/2'}
                    </div>
                    <div className="text-muted-foreground">
                      {lobby.joinedPlayerAddress
                        ? 'Lobby full - Ready to battle!'
                        : 'Waiting for challenger...'}
                    </div>
                  </div>
                </div>
                {lobby.settings.isPrivate && (
                  <div className="flex items-center justify-end gap-2">
                    <div className="text-xs text-muted-foreground">
                      Share this link:
                    </div>
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-sm w-64 h-9"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-9"
                    >
                      {copiedLink ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player 1 Card */}
            <Card
              className={`relative overflow-hidden ${isCreator ? 'ring-2 ring-primary shadow-lg' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
                      1
                    </div>
                    <div>
                      <span className="text-lg">Player 1 (Creator)</span>
                      {isCreator && (
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <CheckCircle className="h-4 w-4" />
                          You
                        </div>
                      )}
                    </div>
                  </div>
                  {lobby.creatorNFT?.isReady && (
                    <Badge
                      variant="default"
                      className="bg-green-500 text-white"
                    >
                      Ready
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {lobby.creatorName ||
                      `${lobby.creatorAddress.slice(0, 8)}...`}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {isCreator ? (
                  <NFTSelector
                    nfts={nfts || []}
                    selectedNFT={selectedNFT}
                    onNFTSelect={handleNFTSelect}
                    isReady={isReady}
                    onReadyToggle={handleReadyToggle}
                    canBeReady={canBeReady}
                  />
                ) : (
                  <div className="space-y-4">
                    {lobby.creatorNFT ? (
                      <div className="space-y-4">
                        {/* Show NFT image and details for spectators */}
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60 border flex-shrink-0">
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              NFT Collection{' '}
                              {lobby.creatorNFT.collection.slice(0, 8)}...
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Item {lobby.creatorNFT.item.slice(0, 8)}...
                            </p>
                            <Badge variant="secondary" className="mt-1">
                              {lobby.creatorNFT.isReady
                                ? 'Ready to battle'
                                : 'Preparing...'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Selecting NFT...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Player 2 Card */}
            <Card
              className={`relative overflow-hidden ${isJoiner ? 'ring-2 ring-primary shadow-lg' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                      2
                    </div>
                    <div>
                      <span className="text-lg">
                        Player 2{' '}
                        {lobby.joinedPlayerAddress ? '(Joined)' : '(Waiting)'}
                      </span>
                      {isJoiner && (
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <CheckCircle className="h-4 w-4" />
                          You
                        </div>
                      )}
                    </div>
                  </div>
                  {lobby.joinerNFT?.isReady && (
                    <Badge
                      variant="default"
                      className="bg-green-500 text-white"
                    >
                      Ready
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {lobby.joinedPlayerAddress ? (
                      <>
                        {lobby.joinedPlayerName ||
                          `${lobby.joinedPlayerAddress.slice(0, 8)}...`}
                      </>
                    ) : (
                      'Waiting for player to join...'
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {lobby.joinedPlayerAddress ? (
                  isJoiner ? (
                    <NFTSelector
                      nfts={nfts || []}
                      selectedNFT={selectedNFT}
                      onNFTSelect={handleNFTSelect}
                      isReady={isReady}
                      onReadyToggle={handleReadyToggle}
                      canBeReady={canBeReady}
                    />
                  ) : (
                    <div className="space-y-4">
                      {lobby.joinerNFT ? (
                        <div className="space-y-4">
                          {/* Show NFT image and details for spectators */}
                          <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60 border flex-shrink-0">
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                NFT Collection{' '}
                                {lobby.joinerNFT.collection.slice(0, 8)}...
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Item {lobby.joinerNFT.item.slice(0, 8)}...
                              </p>
                              <Badge variant="secondary" className="mt-1">
                                {lobby.joinerNFT.isReady
                                  ? 'Ready to battle'
                                  : 'Preparing...'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Selecting NFT...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="relative">
                        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <p className="text-base font-medium mb-2">
                        Waiting for challenger...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Share the lobby link to invite someone!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {lobby.joinedPlayerAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Start Battle</CardTitle>
                <CardDescription>
                  Both players must be ready before the battle can begin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show requirements for both players */}
                {(isCreator || isJoiner) && (
                  <div className="space-y-3">
                    {/* Wallet Requirements Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        {isCreator
                          ? 'Battle Requirements'
                          : 'Wallet Setup Required'}
                      </h4>
                      {isJoiner && (
                        <p className="text-xs text-muted-foreground">
                          Set up your wallet now to avoid delays when the battle
                          starts
                        </p>
                      )}

                      {/* Network Status */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${isOnAssetHub ? 'bg-green-500' : 'bg-orange-500'}`}
                          />
                          <span className="text-sm">AssetHub Network</span>
                          {isCheckingNetwork && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isOnAssetHub ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {isOnAssetHub ? 'Connected' : 'Required'}
                          </Badge>
                          {!isOnAssetHub && (
                            <Button
                              onClick={async () => {
                                if (!talismanConnected) {
                                  await connectWallet();
                                }
                                await switchToAssetHubNetwork();
                              }}
                              size="sm"
                              variant="outline"
                              disabled={isSwitchingNetwork}
                            >
                              {isSwitchingNetwork ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Switching...
                                </>
                              ) : (
                                'Switch'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Wallet Linking Status */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${linkStatus?.hasLinkedEthAddress ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          <span className="text-sm">Wallet Linking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              linkStatus?.hasLinkedEthAddress
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {linkStatus?.hasLinkedEthAddress
                              ? 'Linked'
                              : 'Required'}
                          </Badge>
                          {!linkStatus?.hasLinkedEthAddress && (
                            <Button
                              onClick={() => setShowWalletLinking(true)}
                              size="sm"
                              variant="outline"
                            >
                              Link
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Installation Alert */}
                    {!window.talismanEth && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm text-orange-700 dark:text-orange-300">
                              Talisman extension required
                            </span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href="https://talisman.xyz"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              Install <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status message for joiners */}
                {isJoiner &&
                  talismanConnected &&
                  isOnAssetHub &&
                  linkStatus?.hasLinkedEthAddress && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Your wallet is ready for battle! Waiting for the lobby
                          creator to start.
                        </span>
                      </div>
                    </div>
                  )}

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

                {isCreator && (
                  <Button
                    onClick={handleStartBattle}
                    disabled={!canStartBattle || isStartingBattle}
                    className="w-full"
                    size="lg"
                  >
                    {isStartingBattle ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Battle...
                      </>
                    ) : !bothPlayersReady ? (
                      'Waiting for Players to Ready Up'
                    ) : !talismanConnected ? (
                      'Connect Talisman Wallet First'
                    ) : !isOnAssetHub ? (
                      'Switch to AssetHub Network'
                    ) : !linkStatus?.hasLinkedEthAddress ? (
                      'Link Ethereum Wallet First'
                    ) : !playersEthAddresses ? (
                      'Waiting for Ethereum Address Linking'
                    ) : (
                      <>
                        <Swords className="h-4 w-4 mr-2" />
                        Start Battle!
                      </>
                    )}
                  </Button>
                )}

                {!isCreator && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Waiting for lobby creator to start the battle...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
