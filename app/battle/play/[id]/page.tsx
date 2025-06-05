'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePolkadot } from '@/lib/providers/PolkadotProvider';
import { ethers } from 'ethers';
import { NFTBattleGameABI } from '@/lib/contract/contractABI';
import { decodeHexMetadata, getIpfsImageUrl } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

declare global {
  interface Window {
    talismanEth: any;
  }
}

interface NFTStats {
  attack: number;
  defense: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  speed: number;
  strength: number;
  nftType: number;
}

const CONTRACT_ADDRESS = '0x44b04943ee9f06f2a0f7d28A295776cFa2ad54De';
const NFT_TYPE_NAMES = ['Fire', 'Water', 'Grass'];
const NFT_TYPE_COLORS = {
  0: 'bg-red-500',
  1: 'bg-blue-500',
  2: 'bg-green-500',
};

function NFTCard({
  title,
  nftData,
  playerAddress,
  isCurrentUser,
}: {
  title: string;
  nftData: any;
  playerAddress: string;
  isCurrentUser: boolean;
}) {
  if (!nftData) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const metadata = decodeHexMetadata(nftData.itemMetadata);
  const imageUrl = getIpfsImageUrl(metadata);

  // Generate NFT stats based on metadata or use defaults
  const generateStatsFromMetadata = (metadata: any): NFTStats => {
    // Simple hash-based stat generation from NFT data
    const hash = `${JSON.stringify(metadata || {})}${nftData.collection}${nftData.item}`;
    let hashValue = 0;
    for (let i = 0; i < hash.length; i++) {
      hashValue = hashValue * 31 + hash.charCodeAt(i);
    }

    const rand = (min: number, max: number, seed: number) => {
      const x = Math.sin(seed) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    return {
      attack: rand(20, 80, hashValue + 1),
      defense: rand(20, 80, hashValue + 2),
      intelligence: rand(10, 60, hashValue + 3),
      wisdom: rand(10, 60, hashValue + 4),
      luck: rand(5, 50, hashValue + 5),
      speed: rand(10, 70, hashValue + 6),
      strength: rand(20, 80, hashValue + 7),
      nftType: Math.abs(hashValue) % 3,
    };
  };

  const stats = generateStatsFromMetadata(metadata);
  const typeName = NFT_TYPE_NAMES[stats.nftType];
  const typeColor =
    NFT_TYPE_COLORS[stats.nftType as keyof typeof NFT_TYPE_COLORS];

  return (
    <Card
      className={`w-full max-w-md ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge className={`${typeColor} text-white`}>{typeName}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl && (
          <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={metadata?.name || 'NFT'}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="space-y-2">
          <h4 className="font-semibold">{metadata?.name || 'Unknown NFT'}</h4>
          <p className="text-sm text-muted-foreground">
            Collection: {nftData.collection.slice(0, 8)}...
          </p>
          <p className="text-sm text-muted-foreground">
            Item: {nftData.item.slice(0, 8)}...
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <h5 className="font-medium text-sm">Battle Stats</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Attack:</span>
              <span className="font-medium">{stats.attack}</span>
            </div>
            <div className="flex justify-between">
              <span>Defense:</span>
              <span className="font-medium">{stats.defense}</span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="font-medium">{stats.speed}</span>
            </div>
            <div className="flex justify-between">
              <span>Strength:</span>
              <span className="font-medium">{stats.strength}</span>
            </div>
            <div className="flex justify-between">
              <span>Intelligence:</span>
              <span className="font-medium">{stats.intelligence}</span>
            </div>
            <div className="flex justify-between">
              <span>Luck:</span>
              <span className="font-medium">{stats.luck}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BattlePlayPage() {
  const params = useParams();
  const roomId = params.id as string;
  const { selectedAccount } = usePolkadot();
  const [isConnecting, setIsConnecting] = useState(false);
  const [battleStatus, setBattleStatus] = useState<string>('');
  const [account, setAccount] = useState<string>('');

  // Fetch battle room data
  const battleRoom = useQuery(api.battle.getBattleRoom, { roomId });

  // Fetch NFT data for both players
  const inviterNFTs = useQuery(
    api.nft.getUserNFTs,
    battleRoom?.inviterAddress
      ? { address: battleRoom.inviterAddress }
      : 'skip',
  );

  const joinerNFTs = useQuery(
    api.nft.getUserNFTs,
    battleRoom?.joinerAddress ? { address: battleRoom.joinerAddress } : 'skip',
  );

  // Find specific NFTs being used in battle
  const inviterNFT = inviterNFTs?.find(
    (nft) =>
      nft.collection === battleRoom?.inviterNftCollection &&
      nft.item === battleRoom?.inviterNftItem,
  );

  const joinerNFT = joinerNFTs?.find(
    (nft) =>
      nft.collection === battleRoom?.joinerNftCollection &&
      nft.item === battleRoom?.joinerNftItem,
  );

  const isInviter = selectedAccount?.address === battleRoom?.inviterAddress;
  const canStartBattle = battleRoom?.roomFull && isInviter;

  useEffect(() => {
    if (selectedAccount?.address) {
      setAccount(selectedAccount.address);
    }
  }, [selectedAccount]);

  const connectTalismanWallet = async () => {
    try {
      setIsConnecting(true);
      setBattleStatus('Connecting to Talisman wallet...');

      if (!window.talismanEth) {
        setBattleStatus('Please install Talisman wallet');
        return;
      }

      const accounts = await window.talismanEth.request({
        method: 'eth_requestAccounts',
      });

      setAccount(accounts[0]);
      setBattleStatus('Wallet connected successfully!');
    } catch (error: any) {
      setBattleStatus(`Error connecting wallet: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToAssetHubNetwork = async () => {
    try {
      setBattleStatus('Switching to Asset Hub network...');

      const chainId = `0x190f1b45`;
      console.log(chainId);
      await window.talismanEth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      setBattleStatus('Network switched successfully!');
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
          setBattleStatus('Network added and switched successfully!');
        } catch (addError: any) {
          setBattleStatus(`Error adding network: ${addError.message}`);
        }
      } else {
        setBattleStatus(`Error switching network: ${switchError.message}`);
      }
    }
  };

  const createBattleOnContract = async () => {
    try {
      if (!account || !window.talismanEth) {
        setBattleStatus('Please connect your wallet first');
        return;
      }

      if (!inviterNFT || !joinerNFT || !battleRoom) {
        setBattleStatus('NFT data not loaded yet');
        return;
      }

      if (!battleRoom.joinerEthAddress) {
        setBattleStatus('Joiner ETH address not available');
        return;
      }

      setBattleStatus('Creating battle on blockchain...');

      const provider = new ethers.BrowserProvider(window.talismanEth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        NFTBattleGameABI,
        signer,
      );

      // Generate stats for both NFTs
      const generateStatsFromNFT = (nftData: any): NFTStats => {
        const metadata = decodeHexMetadata(nftData.itemMetadata);
        const hash = `${JSON.stringify(metadata || {})}${nftData.collection}${nftData.item}`;
        let hashValue = 0;
        for (let i = 0; i < hash.length; i++) {
          hashValue = hashValue * 31 + hash.charCodeAt(i);
        }

        const rand = (min: number, max: number, seed: number) => {
          const x = Math.sin(seed) * 10000;
          return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
        };

        return {
          attack: rand(20, 80, hashValue + 1),
          defense: rand(20, 80, hashValue + 2),
          intelligence: rand(10, 60, hashValue + 3),
          wisdom: rand(10, 60, hashValue + 4),
          luck: rand(5, 50, hashValue + 5),
          speed: rand(10, 70, hashValue + 6),
          strength: rand(20, 80, hashValue + 7),
          nftType: Math.abs(hashValue) % 3,
        };
      };

      const p1Stats = generateStatsFromNFT(inviterNFT);
      const p2Stats = generateStatsFromNFT(joinerNFT);

      // Calculate initial health
      const p1Health = Math.floor(
        50 + p1Stats.strength * 0.5 + p1Stats.defense * 0.3,
      );
      const p2Health = Math.floor(
        50 + p2Stats.strength * 0.5 + p2Stats.defense * 0.3,
      );

      if (account.toLowerCase() === battleRoom.joinerEthAddress.toLowerCase()) {
        setBattleStatus('Error: You cannot battle against yourself');
        return;
      }

      const tx = await contract.createBattle(
        battleRoom.joinerEthAddress,
        {
          attack: p1Stats.attack,
          defense: p1Stats.defense,
          intelligence: p1Stats.intelligence,
          wisdom: p1Stats.wisdom,
          luck: p1Stats.luck,
          speed: p1Stats.speed,
          strength: p1Stats.strength,
          nftType: p1Stats.nftType,
        },
        {
          attack: p2Stats.attack,
          defense: p2Stats.defense,
          intelligence: p2Stats.intelligence,
          wisdom: p2Stats.wisdom,
          luck: p2Stats.luck,
          speed: p2Stats.speed,
          strength: p2Stats.strength,
          nftType: p2Stats.nftType,
        },
        p1Health,
        p2Health,
      );

      setBattleStatus('Waiting for transaction confirmation...');
      const receipt = await tx.wait();

      // Parse battle created event to get battle ID
      const battleCreatedEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'BattleCreated');

      if (battleCreatedEvent) {
        const battleId = battleCreatedEvent.args.battleId;
        setBattleStatus(
          `Battle created successfully! Battle ID: ${battleId} | TX: ${receipt.hash}`,
        );
      } else {
        setBattleStatus(`Battle created! TX: ${receipt.hash}`);
      }
    } catch (error: any) {
      setBattleStatus(`Error creating battle: ${error.message}`);
      console.error('Battle creation error:', error);
    }
  };

  if (!battleRoom) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <div className="flex justify-center gap-8">
            <Skeleton className="w-80 h-96" />
            <Skeleton className="w-80 h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Battle Arena</h1>
        <p className="text-muted-foreground">Room ID: {roomId}</p>
        {battleRoom.roomFull ? (
          <Badge variant="default" className="bg-green-500">
            Room Full - Ready to Battle!
          </Badge>
        ) : (
          <Badge variant="secondary">Waiting for opponent...</Badge>
        )}
      </div>

      <div className="flex justify-center items-start gap-8">
        {/* Player 1 (Inviter) */}
        <div className="space-y-4">
          <NFTCard
            title="Player 1 (Inviter)"
            nftData={inviterNFT}
            playerAddress={battleRoom.inviterAddress}
            isCurrentUser={isInviter}
          />
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center h-96">
          <div className="text-4xl font-bold text-muted-foreground px-8">
            VS
          </div>
        </div>

        {/* Player 2 (Joiner) */}
        <div className="space-y-4">
          <NFTCard
            title="Player 2 (Joiner)"
            nftData={joinerNFT}
            playerAddress={battleRoom.joinerAddress || 'Waiting...'}
            isCurrentUser={
              !isInviter &&
              selectedAccount?.address === battleRoom.joinerAddress
            }
          />
        </div>
      </div>

      {/* Battle Controls */}
      {battleRoom.roomFull && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Battle Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {battleStatus && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{battleStatus}</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                {!account && (
                  <Button
                    onClick={connectTalismanWallet}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Talisman Wallet'}
                  </Button>
                )}

                {account && (
                  <>
                    <Button onClick={switchToAssetHubNetwork} variant="outline">
                      Switch to Asset Hub Network
                    </Button>

                    {canStartBattle && (
                      <Button
                        onClick={createBattleOnContract}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Battle on Blockchain
                      </Button>
                    )}
                  </>
                )}
              </div>

              {account && (
                <p className="text-sm text-center text-muted-foreground">
                  Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              )}

              {!canStartBattle && battleRoom.roomFull && (
                <p className="text-sm text-center text-muted-foreground">
                  Only the inviter can start the battle
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
