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
import { Users, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageStateCard } from '@/components/battle/PageStateCard';
import { NFTSelector } from '@/components/battle/NFTSelector';
import { BattleStarter } from '@/components/battle/BattleStarter';
import { WalletLinking } from '@/components/WalletLinking';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNFTs } from '@/hooks/useNFTs';

interface LobbyPageProps {
  params: Promise<{ id: string }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const { selectedAccount, isInitialized } = usePolkadot();
  const { nfts } = useNFTs();

  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showWalletLinking, setShowWalletLinking] = useState(false);

  const lobbyId = Array.isArray(id) ? id[0] : (id ?? '');
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/battle/lobby/${lobbyId}`
      : '';

  // Queries
  const lobby = useQuery(api.lobby.getLobby, { lobbyId });
  const playersEthAddresses = useQuery(
    api.lobby.getBattlePlayersEthAddresses,
    lobby?.joinedPlayerAddress ? { lobbyId } : 'skip',
  );
  const battleIdFromLobby = useQuery(
    api.lobby.getBattleFromLobby,
    lobby?.status === 'started' ? { lobbyId } : 'skip',
  );

  // Mutations
  const updateLobbyNFT = useMutation(api.lobby.updateLobbyNFT);
  const joinLobby = useMutation(api.lobby.joinLobby);

  // Player status
  const isCreator = selectedAccount?.address === lobby?.creatorAddress;
  const isJoiner = selectedAccount?.address === lobby?.joinedPlayerAddress;
  const isInLobby = isCreator || isJoiner;

  // Auto-join lobby
  useEffect(() => {
    if (lobby && selectedAccount && !isInLobby && lobby.status === 'waiting') {
      joinLobby({
        lobbyId,
        playerAddress: selectedAccount.address,
        playerName: selectedAccount.meta.name,
      }).catch(console.error);
    }
  }, [lobby, selectedAccount, isInLobby, lobbyId, joinLobby]);

  // Redirect when battle starts
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
        isReady: false,
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
      setIsReady(!newReadyState);
      toast.error('Failed to update ready state');
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

  // Loading and error states
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

  const PlayerCard = ({
    title,
    description,
    isCurrentPlayer,
    nftData,
    showNFTSelector,
  }: {
    title: string;
    description: string;
    isCurrentPlayer: boolean;
    nftData?: any;
    showNFTSelector: boolean;
  }) => (
    <Card className={isCurrentPlayer ? 'ring-2 ring-blue-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {nftData?.isReady && <Badge variant="default">Ready</Badge>}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {showNFTSelector ? (
          <NFTSelector
            nfts={nfts || []}
            selectedNFT={selectedNFT}
            onNFTSelect={handleNFTSelect}
            isReady={isReady}
            onReadyToggle={handleReadyToggle}
          />
        ) : nftData ? (
          <div>
            <p className="text-sm">
              <strong>NFT:</strong> Collection {nftData.collection.slice(0, 8)}
              ... Item {nftData.item.slice(0, 8)}...
            </p>
            <p className="text-sm text-muted-foreground">
              {nftData.isReady ? 'Ready to battle' : 'Selecting NFT...'}
            </p>
          </div>
        ) : lobby.joinedPlayerAddress ? (
          <p className="text-sm text-muted-foreground">Selecting NFT...</p>
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
  );

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Battle Lobby</h1>
            <p className="text-sm text-muted-foreground">Lobby ID: {lobbyId}</p>
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
            onLinkingComplete={() => setShowWalletLinking(false)}
          />
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Lobby Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lobby Status</span>
                <Badge
                  variant={
                    ['ready', 'started'].includes(lobby.status)
                      ? 'default'
                      : 'secondary'
                  }
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
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-sm w-40 md:w-84 truncate"
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

          {/* Player Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlayerCard
              title="Player 1 (Creator)"
              description={`${
                lobby.creatorName || `${lobby.creatorAddress.slice(0, 8)}...`
              }${isCreator ? ' (You)' : ''}`}
              isCurrentPlayer={isCreator}
              nftData={lobby.creatorNFT}
              showNFTSelector={isCreator}
            />
            <PlayerCard
              title={`Player 2 ${lobby.joinedPlayerAddress ? '(Joined)' : '(Waiting)'}`}
              description={
                lobby.joinedPlayerAddress
                  ? `${
                      lobby.joinedPlayerName ||
                      `${lobby.joinedPlayerAddress.slice(0, 8)}...`
                    }${isJoiner ? ' (You)' : ''}`
                  : 'Waiting for player to join...'
              }
              isCurrentPlayer={isJoiner}
              nftData={lobby.joinerNFT}
              showNFTSelector={isJoiner}
            />
          </div>

          {/* Battle Controls */}
          {lobby.joinedPlayerAddress && (
            <BattleStarter
              lobby={lobby}
              isCreator={isCreator}
              playersEthAddresses={playersEthAddresses}
              onWalletLinking={() => setShowWalletLinking(true)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
