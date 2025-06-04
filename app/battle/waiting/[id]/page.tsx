'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
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

export default function BattleWinningPage() {
  const { id } = useParams();
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState('');

  const roomId = Array.isArray(id) ? id[0] : (id ?? '');
  const battleRoom = useQuery(api.functions.battle.getBattleRoom, { roomId });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      setShareUrl(`${window.location.origin}/battle/join/${roomId}`);
    }
  }, [roomId]);

  useEffect(() => {
    if (battleRoom?.roomFull) {
      router.push(`/battle/play/${roomId}`);
    }
  }, [battleRoom, roomId, router]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  };

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

  if (battleRoom.roomFull) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-xl font-semibold">Room is Full!</h2>
              <p className="text-muted-foreground mt-2">
                This battle room is already at capacity.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="mt-4 w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              🎉 Battle Room Created!
            </h1>
            <p className="text-xl text-muted-foreground">
              Your NFT is ready for battle. Invite someone to challenge you!
            </p>
          </div>

          {/* Room Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 Battle Room Details
              </CardTitle>
              <CardDescription>
                Room ID: <Badge variant="secondary">{roomId}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">NFT Collection</p>
                  <p className="font-medium">{battleRoom.nftCollection}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NFT Item</p>
                  <p className="font-medium">{battleRoom.nftItem}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Creator</p>
                  <p className="font-medium text-xs">
                    {battleRoom.userAddress.slice(0, 8)}...
                    {battleRoom.userAddress.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={battleRoom.roomFull ? 'default' : 'secondary'}
                  >
                    {battleRoom.roomFull ? 'Full' : 'Waiting for opponent'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📤 Invite Players
              </CardTitle>
              <CardDescription>
                Share your battle room with others to start the fight!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Share */}
              <div className="space-y-3">
                <p className="font-medium">Share Link</p>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    📋 Copy
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="default"
                  onClick={() =>
                    navigator.share &&
                    navigator.share({
                      title: 'Join my NFT Battle!',
                      text: 'Challenge me to an epic NFT battle!',
                      url: shareUrl,
                    })
                  }
                  className="w-full"
                >
                  📤 Share Battle Room
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/battle/waiting/${roomId}`)}
                  className="w-full"
                >
                  👁️ View Waiting Room
                </Button>
              </div>

              <Separator />

              {/* Additional Actions */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">How it works</h3>
                <p className="text-sm text-muted-foreground">
                  Share the room link with a friend. When they join with their
                  NFT, the battle will begin automatically!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
