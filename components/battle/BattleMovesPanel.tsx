import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ExternalLink,
  Swords,
  Shield,
  Zap,
  Brain,
  Star,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import type { BattleMove } from '@/lib/battle-moves';

interface BattleMovesPanelProps {
  moves: BattleMove[];
  selectedMove: BattleMove | null;
  onMoveSelect: (move: BattleMove) => void;
  onExecuteTurn: () => void;
  isMyTurn: boolean;
  isPending: boolean;
  gameFinished: boolean;
  isExecutingTurn: boolean;
  connectionStatus?: string;
  pendingTxHash?: string;
}

export function BattleMovesPanel({
  moves,
  selectedMove,
  onMoveSelect,
  onExecuteTurn,
  isMyTurn,
  isPending,
  gameFinished,
  isExecutingTurn,
  connectionStatus,
  pendingTxHash,
}: BattleMovesPanelProps) {
  const getIcon = (iconName: string) => {
    const iconProps = { className: 'size-4' };

    switch (iconName) {
      case 'Swords':
        return <Swords {...iconProps} />;
      case 'Shield':
        return <Shield {...iconProps} />;
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'Brain':
        return <Brain {...iconProps} />;
      case 'Star':
        return <Star {...iconProps} />;
      case 'Flame':
        return <Flame {...iconProps} />;
      case 'Water':
        return <span className="text-blue-500">💧</span>;
      case 'Grass':
        return <span className="text-green-500">🌿</span>;
      default:
        return <Star {...iconProps} />;
    }
  };

  return (
    <Card className="mb-6 rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium">Available Moves</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          {/* Move Buttons */}
          <div className="space-y-4 flex-shrink-0">
            {/* Top Row */}
            <div className="flex gap-4">
              {moves.slice(0, 2).map((move) => (
                <Button
                  key={move.name}
                  variant="outline"
                  className={`w-44 h-11 ${
                    selectedMove?.name === move.name
                      ? 'border-primary bg-primary/10'
                      : ''
                  }`}
                  onClick={() => onMoveSelect(move)}
                  disabled={!isMyTurn || isPending || gameFinished}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(move.iconName)}
                    {move.name}
                  </div>
                </Button>
              ))}
            </div>

            {/* Bottom Row */}
            <div className="flex gap-4">
              {moves.slice(2, 4).map((move) => (
                <Button
                  key={move.name}
                  variant="outline"
                  className={`w-44 h-11 ${
                    selectedMove?.name === move.name
                      ? 'border-primary bg-primary/10'
                      : ''
                  }`}
                  onClick={() => onMoveSelect(move)}
                  disabled={!isMyTurn || isPending || gameFinished}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(move.iconName)}
                    {move.name}
                  </div>
                </Button>
              ))}
            </div>

            {/* Execute Move Button */}
            <Button
              className="w-full h-11"
              onClick={onExecuteTurn}
              disabled={
                isExecutingTurn ||
                !isMyTurn ||
                isPending ||
                !selectedMove ||
                gameFinished
              }
            >
              {gameFinished ? (
                'Battle Complete'
              ) : isExecutingTurn ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : isPending ? (
                'Processing...'
              ) : !isMyTurn ? (
                "Opponent's Turn"
              ) : !selectedMove ? (
                'Select a move'
              ) : (
                `Use ${selectedMove.name}`
              )}
            </Button>
          </div>

          {/* Move Description Panel */}
          <Card className="flex-1 bg-card/30">
            <CardContent className="p-6">
              {selectedMove ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium flex items-center gap-2">
                      {getIcon(selectedMove.iconName)}
                      {selectedMove.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Swords className="size-4 text-yellow-400" />
                      <span className="text-lg font-medium">
                        {selectedMove.power}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedMove.type}
                    </Badge>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedMove.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Select a move to see details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Status and Pending Transaction */}
        <div className="space-y-2">
          {/* Connection Status */}
          {connectionStatus && (
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-sm text-center text-muted-foreground">
                {connectionStatus}
              </CardContent>
            </Card>
          )}

          {/* Pending Transaction */}
          {isPending && pendingTxHash && (
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Transaction pending...</span>
                </div>
                <Link
                  href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${pendingTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-xs flex items-center gap-1 justify-center"
                >
                  View on Explorer <ExternalLink className="size-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
