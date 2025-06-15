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
import { Users, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
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
import { useNFTs } from '@/hooks/useNFTs';
import { ethers } from 'ethers';
import { VulpixPVMABI } from '@/lib/contract/contractABI';
import { env } from '@/env';
import { WalletLinking } from '@/components/WalletLinking';
import { ASSET_HUB_CHAIN_ID } from '@/lib/constants/chains';
import { OpponentNFTDisplay } from '@/components/lobby/OpponentNFTDisplay';
import { PlayerCard } from '@/components/lobby/PlayerCard';
import { WalletStatusItem } from '@/components/lobby/WalletStatusItem';
import { LobbyStatusCard } from '@/components/lobby/LobbyStatusCard';
import { WaitingPlayerDisplay } from '@/components/lobby/WaitingPlayerDisplay';
import { AlertCard } from '@/components/lobby/AlertCard';
import { BattleReadinessCard } from '@/components/lobby/BattleReadinessCard';

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
  const creatorNFTMetadata = useQuery(
    api.nft.getNFTMetadata,
    lobby?.creatorNFT
      ? {
          collection: lobby.creatorNFT.collection,
          item: lobby.creatorNFT.item,
        }
      : 'skip',
  );
  const joinerNFTMetadata = useQuery(
    api.nft.getNFTMetadata,
    lobby?.joinerNFT
      ? {
          collection: lobby.joinerNFT.collection,
          item: lobby.joinerNFT.item,
        }
      : 'skip',
  );

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
          <LobbyStatusCard lobby={lobby} shareUrl={shareUrl} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PlayerCard
              playerNumber={1}
              title="Player 1 (Creator)"
              playerName={lobby.creatorName}
              playerAddress={lobby.creatorAddress}
              isCurrentUser={isCreator}
              nftData={lobby.creatorNFT}
              isJoined={true}
              gradientColor="from-primary/5"
              avatarColors="from-red-500 to-red-600"
            >
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
                <div className="space-y-6">
                  {lobby.creatorNFT ? (
                    <OpponentNFTDisplay
                      nftData={lobby.creatorNFT}
                      nftMetadata={creatorNFTMetadata}
                      playerColor="bg-primary"
                    />
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
            </PlayerCard>

            <PlayerCard
              playerNumber={2}
              title={`Player 2 ${lobby.joinedPlayerAddress ? '(Joined)' : '(Waiting)'}`}
              playerName={lobby.joinedPlayerName}
              playerAddress={lobby.joinedPlayerAddress}
              isCurrentUser={isJoiner}
              nftData={lobby.joinerNFT}
              isJoined={!!lobby.joinedPlayerAddress}
              gradientColor="from-blue-500/5"
              avatarColors="from-blue-500 to-blue-600"
            >
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
                  <div className="space-y-6">
                    {lobby.joinerNFT ? (
                      <OpponentNFTDisplay
                        nftData={lobby.joinerNFT}
                        nftMetadata={joinerNFTMetadata}
                        playerColor="bg-blue-500"
                      />
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
                <WaitingPlayerDisplay />
              )}
            </PlayerCard>
          </div>

          {(isCreator || isJoiner) && (
            <Card className="border-2 border-dashed border-muted-foreground/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  {isCreator ? 'Battle Requirements' : 'Wallet Setup Required'}
                </CardTitle>
                <CardDescription>
                  {isCreator
                    ? 'Ensure all requirements are met before starting the battle'
                    : 'Set up your wallet now to avoid delays when the battle starts'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <WalletStatusItem
                  title="Talisman Wallet"
                  description={
                    talismanConnected ? 'Connected' : 'Not connected'
                  }
                  isConnected={talismanConnected}
                  statusText={{ connected: 'Connected', required: 'Required' }}
                  actionButton={
                    !talismanConnected && (
                      <Button
                        onClick={connectWallet}
                        size="sm"
                        variant="outline"
                      >
                        Connect
                      </Button>
                    )
                  }
                />

                <WalletStatusItem
                  title="AssetHub Network"
                  description={
                    isOnAssetHub ? 'Connected to AssetHub' : 'Switch required'
                  }
                  isConnected={isOnAssetHub}
                  statusText={{ connected: 'Connected', required: 'Required' }}
                  extraContent={
                    isCheckingNetwork && (
                      <div className="flex items-center gap-1 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs text-muted-foreground">
                          Checking...
                        </span>
                      </div>
                    )
                  }
                  actionButton={
                    !isOnAssetHub &&
                    talismanConnected && (
                      <Button
                        onClick={switchToAssetHubNetwork}
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
                          'Switch Network'
                        )}
                      </Button>
                    )
                  }
                />

                <WalletStatusItem
                  title="Ethereum Wallet"
                  description={
                    linkStatus?.hasLinkedEthAddress
                      ? `Linked: ${ethAddress?.slice(0, 6)}...${ethAddress?.slice(-4)}`
                      : 'Link required for battles'
                  }
                  isConnected={!!linkStatus?.hasLinkedEthAddress}
                  statusText={{ connected: 'Linked', required: 'Required' }}
                  actionButton={
                    !linkStatus?.hasLinkedEthAddress && (
                      <Button
                        onClick={() => setShowWalletLinking(true)}
                        size="sm"
                        variant="outline"
                      >
                        Link Wallet
                      </Button>
                    )
                  }
                />

                {/* Installation Alert */}
                {!window.talismanEth && (
                  <AlertCard
                    variant="warning"
                    title="Talisman Extension Required"
                    description="Install the browser extension to continue"
                    actionButton={{
                      text: 'Install Extension',
                      href: 'https://talisman.xyz',
                    }}
                  />
                )}

                {/* Success message for wallet setup */}
                {(isCreator || isJoiner) &&
                  talismanConnected &&
                  isOnAssetHub &&
                  linkStatus?.hasLinkedEthAddress && (
                    <AlertCard
                      variant="success"
                      title="Wallet Setup Complete!"
                      description={
                        isCreator
                          ? 'You can start the battle once both players are ready'
                          : 'Waiting for the lobby creator to start the battle'
                      }
                    />
                  )}
              </CardContent>
            </Card>
          )}

          {lobby.joinedPlayerAddress && (
            <BattleReadinessCard
              bothPlayersReady={bothPlayersReady || false}
              isCreator={isCreator}
              canStartBattle={canStartBattle || false}
              isStartingBattle={isStartingBattle}
              onStartBattle={handleStartBattle}
              creatorReady={!!lobby.creatorNFT?.isReady}
              joinerReady={!!lobby.joinerNFT?.isReady}
              talismanConnected={talismanConnected}
              isOnAssetHub={isOnAssetHub}
              hasLinkedEthAddress={linkStatus?.hasLinkedEthAddress}
              playersEthAddresses={playersEthAddresses}
            />
          )}
        </div>
      </main>
    </div>
  );
}
