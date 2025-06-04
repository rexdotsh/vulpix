'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
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

export default function BattleJoinPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isReady, selectedAccount } = usePolkadot();
  const { nftManager, isInitialized } = useAssetHub();

  const [isJoining, setIsJoining] = useState(false);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  const roomId = Array.isArray(id) ? id[0] : (id ?? '');
  const battleRoom = useQuery(api.functions.battle.getBattleRoom, { roomId });
  const joinBattleRoom = useMutation(api.functions.battle.joinBattleRoom);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!isReady || !selectedAccount || !nftManager || !isInitialized) return;

      setIsLoadingNFTs(true);
      try {
        // using assethub
        const nfts = await nftManager.getUserNFTs(selectedAccount.address);
        setUserNFTs(nfts);
      } catch (error) {
        console.error('Failed to fetch NFTs:', error);
      } finally {
        setIsLoadingNFTs(false);
      }
    };

    fetchNFTs();
  }, [isReady, selectedAccount?.address, nftManager, isInitialized]);

  useEffect(() => {
    if (battleRoom?.roomFull) {
      router.push(`/battle/play/${roomId}`);
    }
  }, [battleRoom?.roomFull, roomId, router]);

  const handleJoinBattle = async () => {
    if (!selectedNFT || !selectedAccount) return;

    setIsJoining(true);
    try {
      await joinBattleRoom({
        roomId,
        joinerAddress: selectedAccount.address,
        joinerNftCollection: selectedNFT.collection,
        joinerNftItem: selectedNFT.item,
      });
    } catch (error) {
      console.error('Failed to join battle:', error);
      setIsJoining(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to join this battle room.
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

  if (!battleRoom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
            <p className="text-center mt-4 text-muted-foreground">
              Loading battle room...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              ⚔️ Join Battle Room
            </h1>
            <p className="text-lg text-muted-foreground">
              You've been invited to an epic NFT battle!
            </p>
          </div>

          {/* Battle Room Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 Battle Details
              </CardTitle>
              <CardDescription>
                Room ID: <Badge variant="secondary">{roomId}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    Opponent's NFT Collection
                  </p>
                  <p className="font-medium">
                    {battleRoom.inviterNftCollection}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Opponent's NFT Item</p>
                  <p className="font-medium">{battleRoom.inviterNftItem}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created By</p>
                  <p className="font-medium text-xs">
                    {battleRoom.inviterAddress.slice(0, 8)}...
                    {battleRoom.inviterAddress.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="secondary">Waiting for challenger</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFT Selection */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ Choose Your Fighter</CardTitle>
              <CardDescription>
                Select an NFT from your collection to battle with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingNFTs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground">
                    Loading your NFTs...
                  </p>
                </div>
              ) : userNFTs.length === 0 ? (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-muted-foreground text-sm">
                    You don't have any NFTs in your collection. You need at
                    least one NFT to participate in battles.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userNFTs.map((nft) => (
                    <Card
                      key={`${nft.collection}-${nft.item}`}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedNFT?.collection === nft.collection &&
                        selectedNFT?.item === nft.item
                          ? 'ring-2 ring-primary bg-primary/5'
                          : ''
                      }`}
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <div className="text-2xl">🖼️</div>
                          <h3 className="font-semibold">Item #{nft.item}</h3>
                          <p className="text-sm text-muted-foreground">
                            Collection: {nft.collection}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJoinBattle}
                  disabled={!selectedNFT || isJoining || userNFTs.length === 0}
                  className="flex-1"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Joining Battle...
                    </>
                  ) : (
                    '⚔️ Join Battle!'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Ready to Battle?</h3>
                <p className="text-sm text-muted-foreground">
                  Select your strongest NFT and join the battle! Once you join,
                  the fight will begin immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
