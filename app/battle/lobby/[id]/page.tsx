'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';
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
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Clock,
  Copy,
  Check,
  Loader2,
  Swords,
  Shield,
  Zap,
  Brain,
  Dices,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNFTs } from '@/hooks/useNFTs';
import { decodeHexMetadata } from '@/lib/utils';
import { ethers } from 'ethers';
import { VulpixPVMABI } from '@/lib/contract/contractABI';

const CONTRACT_ADDRESS = '0x6761CD4db5D747562bf6DACA6eC92ed277Af4F98';
const NFT_TYPE_NAMES = ['Fire', 'Water', 'Grass'];
const NFT_TYPE_COLORS = {
  0: 'bg-red-500',
  1: 'bg-blue-500',
  2: 'bg-green-500',
};

declare global {
  interface Window {
    talismanEth: any;
  }
}

function NFTStatsDisplay({ stats }: { stats: any }) {
  const typeName = NFT_TYPE_NAMES[stats.nftType];
  const typeColor =
    NFT_TYPE_COLORS[stats.nftType as keyof typeof NFT_TYPE_COLORS];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Type</span>
        <Badge className={`${typeColor} text-white`}>{typeName}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Swords className="h-3 w-3" />
            Attack:
          </span>
          <span className="font-medium">{stats.attack}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Defense:
          </span>
          <span className="font-medium">{stats.defense}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Speed:
          </span>
          <span className="font-medium">{stats.speed}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Strength:
          </span>
          <span className="font-medium">{stats.strength}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Intelligence:
          </span>
          <span className="font-medium">{stats.intelligence}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Dices className="h-3 w-3" />
            Luck:
          </span>
          <span className="font-medium">{stats.luck}</span>
        </div>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>Max Health:</span>
        <span className="text-green-600">{stats.maxHealth}</span>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { selectedAccount, getInjector } = usePolkadot();
  const { nftManager, isInitialized } = useAssetHub();
  const { nfts } = useNFTs();

  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  const [talismanConnected, setTalismanConnected] = useState(false);

  const lobbyId = Array.isArray(id) ? id[0] : (id ?? '');
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/battle/lobby/${lobbyId}`
      : '';

  // Queries and mutations
  const lobby = useQuery(api.battle.getLobby, { lobbyId });
  const updateLobbyNFT = useMutation(api.battle.updateLobbyNFT);
  const startBattleFromLobby = useMutation(api.battle.startBattleFromLobby);
  const updateBattleContractInfo = useMutation(
    api.battle.updateBattleContractInfo,
  );
  const joinLobby = useMutation(api.battle.joinLobby);

  const isCreator = selectedAccount?.address === lobby?.creatorAddress;
  const isJoiner = selectedAccount?.address === lobby?.joinedPlayerAddress;
  const isInLobby = isCreator || isJoiner;

  // Auto-join if not in lobby and lobby exists
  useEffect(() => {
    if (lobby && selectedAccount && !isInLobby && lobby.status === 'waiting') {
      joinLobby({
        lobbyId,
        playerAddress: selectedAccount.address,
        playerName: selectedAccount.meta.name,
      }).catch(console.error);
    }
  }, [lobby, selectedAccount, isInLobby]);

  // Redirect to battle if started
  useEffect(() => {
    if (lobby?.status === 'started') {
      // Find the battle and redirect
      // We'll need to implement a way to get battle ID from lobby
      router.push('/battle');
    }
  }, [lobby?.status, router]);

  const generateStatsFromNFT = (nft: any) => {
    const metadata = decodeHexMetadata(nft.itemMetadata?.data);
    const hash = `${metadata?.name || ''}${nft.collection}${nft.item}`;
    let hashValue = 0;
    for (let i = 0; i < hash.length; i++) {
      hashValue = hashValue * 31 + hash.charCodeAt(i);
    }

    const rand = (min: number, max: number, seed: number) => {
      const x = Math.sin(seed) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    const stats = {
      attack: rand(20, 80, hashValue + 1),
      defense: rand(20, 80, hashValue + 2),
      intelligence: rand(10, 60, hashValue + 3),
      luck: rand(5, 50, hashValue + 5),
      speed: rand(10, 70, hashValue + 6),
      strength: rand(20, 80, hashValue + 7),
      nftType: Math.abs(hashValue) % 3,
      maxHealth: 0,
    };

    stats.maxHealth = Math.floor(
      50 + stats.strength * 0.5 + stats.defense * 0.3,
    );
    return stats;
  };

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

  const connectTalismanWallet = async () => {
    if (!window.talismanEth) {
      toast.error('Talisman wallet not found');
      return false;
    }

    try {
      const accounts = await window.talismanEth.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setTalismanConnected(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect Talisman wallet:', error);
      toast.error('Failed to connect Talisman wallet');
      return false;
    }
  };

  const switchToAssetHubNetwork = async () => {
    try {
      const chainId = `0x190f1b45`;
      await window.talismanEth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          const chainId = `0x190f1b45`;
          await window.talismanEth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId,
                chainName: 'Asset Hub Testnet',
                nativeCurrency: {
                  name: 'Asset Hub Token',
                  symbol: 'PAS',
                  decimals: 18,
                },
                rpcUrls: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
                blockExplorerUrls: [
                  'https://blockscout-asset-hub.parity-chains-scw.parity.io',
                ],
              },
            ],
          });
        } catch (addError: any) {
          // TODO: FIX
          // throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  const handleStartBattle = async () => {
    if (!selectedAccount || !lobby || !talismanConnected) return;

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
        lobby.joinedPlayerAddress, // player2 address
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

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to join this lobby.
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

  if (!lobby) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                Loading lobby...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (lobby.status === 'expired' || lobby.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Lobby {lobby.status}
              </h2>
              <p className="text-muted-foreground mb-4">
                This lobby is no longer available.
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

  const bothPlayersReady =
    lobby.creatorNFT?.isReady && lobby.joinerNFT?.isReady;
  const canStartBattle = bothPlayersReady && isCreator && talismanConnected;
  const timeLeft = Math.max(
    0,
    Math.ceil((lobby.expiresAt - Date.now()) / 60000),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/battle')}>
                ← Back to Arena
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Battle Lobby</span>
                <Badge variant="outline">{lobbyId}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{timeLeft}m left</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Lobby Status */}
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
                  <div className="space-y-4">
                    {/* NFT Selection */}
                    <div>
                      <label
                        htmlFor="nft-select"
                        className="text-sm font-medium mb-2 block"
                      >
                        Select Your NFT
                      </label>
                      {!nfts || nfts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No NFTs available. Please mint some NFTs first.
                        </p>
                      ) : (
                        <Select
                          value={
                            selectedNFT
                              ? `${selectedNFT.collection}-${selectedNFT.item}`
                              : ''
                          }
                          onValueChange={(value) => {
                            const nft = nfts.find(
                              (n) => `${n.collection}-${n.item}` === value,
                            );
                            if (nft) handleNFTSelect(nft);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an NFT" />
                          </SelectTrigger>
                          <SelectContent>
                            {nfts.map((nft) => {
                              const metadata = decodeHexMetadata(
                                nft.itemMetadata?.data,
                              );
                              return (
                                <SelectItem
                                  key={`${nft.collection}-${nft.item}`}
                                  value={`${nft.collection}-${nft.item}`}
                                >
                                  {metadata?.name || `Item #${nft.item}`}{' '}
                                  (Collection: {nft.collection.slice(0, 8)}...)
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* NFT Stats */}
                    {selectedNFT && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Battle Stats
                        </h4>
                        <NFTStatsDisplay
                          stats={generateStatsFromNFT(selectedNFT)}
                        />
                      </div>
                    )}

                    {/* Ready Button */}
                    <Button
                      onClick={handleReadyToggle}
                      disabled={!selectedNFT}
                      variant={isReady ? 'default' : 'outline'}
                      className="w-full"
                    >
                      {isReady ? 'Ready!' : 'Mark as Ready'}
                    </Button>
                  </div>
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
                    <div className="space-y-4">
                      {/* NFT Selection */}
                      <div>
                        <label
                          htmlFor="nft-select"
                          className="text-sm font-medium mb-2 block"
                        >
                          Select Your NFT
                        </label>
                        {!nfts || nfts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No NFTs available. Please mint some NFTs first.
                          </p>
                        ) : (
                          <Select
                            value={
                              selectedNFT
                                ? `${selectedNFT.collection}-${selectedNFT.item}`
                                : ''
                            }
                            onValueChange={(value) => {
                              const nft = nfts.find(
                                (n) => `${n.collection}-${n.item}` === value,
                              );
                              if (nft) handleNFTSelect(nft);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an NFT" />
                            </SelectTrigger>
                            <SelectContent>
                              {nfts.map((nft) => {
                                const metadata = decodeHexMetadata(
                                  nft.itemMetadata?.data,
                                );
                                return (
                                  <SelectItem
                                    key={`${nft.collection}-${nft.item}`}
                                    value={`${nft.collection}-${nft.item}`}
                                  >
                                    {metadata?.name || `Item #${nft.item}`}{' '}
                                    (Collection: {nft.collection.slice(0, 8)}
                                    ...)
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* NFT Stats */}
                      {selectedNFT && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Battle Stats
                          </h4>
                          <NFTStatsDisplay
                            stats={generateStatsFromNFT(selectedNFT)}
                          />
                        </div>
                      )}

                      {/* Ready Button */}
                      <Button
                        onClick={handleReadyToggle}
                        disabled={!selectedNFT}
                        variant={isReady ? 'default' : 'outline'}
                        className="w-full"
                      >
                        {isReady ? 'Ready!' : 'Mark as Ready'}
                      </Button>
                    </div>
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
                {!talismanConnected && isCreator && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connect Talisman wallet to create battle on blockchain
                    </p>
                    <Button
                      onClick={connectTalismanWallet}
                      variant="outline"
                      className="w-full"
                    >
                      Connect Talisman Wallet
                    </Button>
                  </div>
                )}

                {talismanConnected && isCreator && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Switch to AssetHub network for battle transactions
                    </p>
                    <Button
                      onClick={switchToAssetHubNetwork}
                      variant="outline"
                      className="w-full"
                    >
                      Switch to AssetHub Network
                    </Button>
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
