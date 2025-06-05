'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Users, Copy, Check, Loader2, Swords } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BattleHeader } from '@/components/battle/BattleHeader';
import { PageStateCard } from '@/components/battle/PageStateCard';
import { NFTSelector } from '@/components/battle/NFTSelector';
import { useTalismanWallet } from '@/hooks/useTalismanWallet';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNFTs } from '@/hooks/useNFTs';
import { ethers } from 'ethers';
import { VulpixPVMABI } from '@/lib/contract/contractABI';
import { CONTRACT_ADDRESS } from '@/lib/battle-utils';
import { WalletLinking } from '@/components/WalletLinking';

export default function LobbyPage() {
  const { id } = useParams();
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
    connectWallet: connectTalismanWallet,
    switchToAssetHubNetwork,
  } = useTalismanWallet();

  const lobbyId = Array.isArray(id) ? id[0] : (id ?? '');
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/battle/lobby/${lobbyId}`
      : '';

  const lobby = useQuery(api.battle.getLobby, { lobbyId });
  const linkStatus = useQuery(
    api.battle.getUserLinkStatus,
    selectedAccount ? { polkadotAddress: selectedAccount.address } : 'skip',
  );
  const playersEthAddresses = useQuery(
    api.battle.getBattlePlayersEthAddresses,
    lobby?.joinedPlayerAddress ? { lobbyId } : 'skip',
  );
  const updateLobbyNFT = useMutation(api.battle.updateLobbyNFT);
  const startBattleFromLobby = useMutation(api.battle.startBattleFromLobby);
  const updateBattleContractInfo = useMutation(
    api.battle.updateBattleContractInfo,
  );
  const joinLobby = useMutation(api.battle.joinLobby);

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
    if (lobby?.status === 'started') {
      router.push('/battle');
    }
  }, [lobby?.status, router]);

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
      // 1. Start battle in Convex (generates battle ID and stats)
      const battleData = await startBattleFromLobby({
        lobbyId,
        initiatorAddress: selectedAccount.address,
      });

      // 2. Connect to blockchain
      const provider = new ethers.BrowserProvider(window.talismanEth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        VulpixPVMABI,
        signer,
      );

      // 3. Create battle on smart contract
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

      // 4. Wait for confirmation and get battle ID
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

      // 5. Update battle with contract info
      await updateBattleContractInfo({
        battleId: battleData.battleId,
        contractBattleId,
        creationTxHash: receipt.hash,
      });

      toast.success('Battle created successfully!');

      // 6. Redirect to battle
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
        title="Wallet Required"
        message="Please connect your wallet to join this lobby."
        buttonText="Connect Wallet"
        redirectTo="/"
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

  const bothPlayersReady =
    lobby.creatorNFT?.isReady && lobby.joinerNFT?.isReady;
  const canStartBattle =
    bothPlayersReady && isCreator && talismanConnected && playersEthAddresses;

  return (
    <div className="min-h-screen bg-background">
      <BattleHeader
        title="Battle Lobby"
        backHref="/battle"
        backLabel="Back to Arena"
        battleId={lobbyId}
      />

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
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lobby Status</span>
                <Badge
                  variant={lobby.status === 'ready' ? 'default' : 'secondary'}
                >
                  {lobby.status === 'waiting'
                    ? 'Waiting for Players'
                    : lobby.status === 'ready'
                      ? 'Ready to Start'
                      : lobby.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                {lobby.settings.isPrivate ? 'Private lobby' : 'Public lobby'} •
                Created{' '}
                {formatDistanceToNow(lobby.createdAt, { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <div className="font-medium">
                      Players: {lobby.joinedPlayerAddress ? '2/2' : '1/2'}
                    </div>
                    <div className="text-muted-foreground">
                      {lobby.joinedPlayerAddress
                        ? 'Lobby full'
                        : 'Waiting for opponent'}
                    </div>
                  </div>
                </div>
                {lobby.settings.isPrivate && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-sm w-64"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
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

          {/* Players Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Creator */}
            <Card className={isCreator ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Player 1 (Creator)</span>
                  {lobby.creatorNFT?.isReady && (
                    <Badge variant="default">Ready</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {lobby.creatorName ||
                    `${lobby.creatorAddress.slice(0, 8)}...`}
                  {isCreator && <span className="text-blue-500"> (You)</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCreator ? (
                  <NFTSelector
                    nfts={nfts || []}
                    selectedNFT={selectedNFT}
                    onNFTSelect={handleNFTSelect}
                    isReady={isReady}
                    onReadyToggle={handleReadyToggle}
                  />
                ) : (
                  <div className="space-y-4">
                    {lobby.creatorNFT ? (
                      <div>
                        <p className="text-sm">
                          <strong>NFT:</strong> Collection{' '}
                          {lobby.creatorNFT.collection.slice(0, 8)}... Item{' '}
                          {lobby.creatorNFT.item.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lobby.creatorNFT.isReady
                            ? 'Ready to battle'
                            : 'Selecting NFT...'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Selecting NFT...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Joiner */}
            <Card className={isJoiner ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Player 2{' '}
                    {lobby.joinedPlayerAddress ? '(Joined)' : '(Waiting)'}
                  </span>
                  {lobby.joinerNFT?.isReady && (
                    <Badge variant="default">Ready</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {lobby.joinedPlayerAddress ? (
                    <>
                      {lobby.joinedPlayerName ||
                        `${lobby.joinedPlayerAddress.slice(0, 8)}...`}
                      {isJoiner && (
                        <span className="text-blue-500"> (You)</span>
                      )}
                    </>
                  ) : (
                    'Waiting for player to join...'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lobby.joinedPlayerAddress ? (
                  isJoiner ? (
                    <NFTSelector
                      nfts={nfts || []}
                      selectedNFT={selectedNFT}
                      onNFTSelect={handleNFTSelect}
                      isReady={isReady}
                      onReadyToggle={handleReadyToggle}
                    />
                  ) : (
                    <div className="space-y-4">
                      {lobby.joinerNFT ? (
                        <div>
                          <p className="text-sm">
                            <strong>NFT:</strong> Collection{' '}
                            {lobby.joinerNFT.collection.slice(0, 8)}... Item{' '}
                            {lobby.joinerNFT.item.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lobby.joinerNFT.isReady
                              ? 'Ready to battle'
                              : 'Selecting NFT...'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Selecting NFT...
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Waiting for opponent...
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Battle Controls */}
          {lobby.joinedPlayerAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Start Battle</CardTitle>
                <CardDescription>
                  Both players must be ready before the battle can begin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCreator && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connect Talisman wallet to create battle on blockchain
                    </p>
                    <Button
                      onClick={connectTalismanWallet}
                      variant="outline"
                      className="w-full"
                      disabled={talismanConnected}
                    >
                      {talismanConnected
                        ? 'Talisman Connected'
                        : 'Connect Talisman Wallet'}
                    </Button>
                    {talismanConnected && (
                      <Button
                        onClick={switchToAssetHubNetwork}
                        variant="outline"
                        className="w-full"
                      >
                        Switch to AssetHub Network
                      </Button>
                    )}
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
