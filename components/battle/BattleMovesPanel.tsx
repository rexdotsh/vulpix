import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ExternalLink,
  Star,
  Swords,
  Flame,
  Zap,
  Shield,
  Target,
  Brain,
  Heart,
  Eye,
  Wind,
  Leaf,
  Sun,
  Sparkles,
  Crown,
  Diamond,
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
  pendingTxHash?: string;
  disabled?: boolean;
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
  pendingTxHash,
  disabled = false,
}: BattleMovesPanelProps) {
  const getIcon = (iconName: string) => {
    const iconProps = { className: 'size-4' };

    switch (iconName) {
      case 'Flame':
        return <Flame {...iconProps} />;
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'Shield':
        return <Shield {...iconProps} />;
      case 'Swords':
        return <Swords {...iconProps} />;
      case 'Target':
        return <Target {...iconProps} />;
      case 'Brain':
        return <Brain {...iconProps} />;
      case 'Heart':
        return <Heart {...iconProps} />;
      case 'Eye':
        return <Eye {...iconProps} />;
      case 'Wind':
        return <Wind {...iconProps} />;
      case 'Leaf':
        return <Leaf {...iconProps} />;
      case 'Sun':
        return <Sun {...iconProps} />;
      case 'Sparkles':
        return <Sparkles {...iconProps} />;
      case 'Crown':
        return <Crown {...iconProps} />;
      case 'Diamond':
        return <Diamond {...iconProps} />;
      case 'Star':
        return <Star {...iconProps} />;
      default:
        return <Star {...iconProps} />;
    }
  };

  return (
    <Card className="mb-6 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Available Moves</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-4">
          <div className="space-y-3 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {moves.map((move) => (
                <Button
                  key={move.name}
                  variant="outline"
                  className={`w-44 h-11 transition-all duration-200 ease-in-out ${
                    selectedMove?.name === move.name
                      ? '!border-primary !border-2 bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'hover:!border-primary hover:border-2 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10 hover:scale-[1.01]'
                  }`}
                  onClick={() => onMoveSelect(move)}
                  disabled={!isMyTurn || isPending || gameFinished || disabled}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(move.iconName)}
                    {move.name}
                  </div>
                </Button>
              ))}
            </div>

            <Button
              className={`w-full h-11 ${
                selectedMove &&
                isMyTurn &&
                !isPending &&
                !isExecutingTurn &&
                !gameFinished
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : ''
              }`}
              onClick={onExecuteTurn}
              disabled={
                isExecutingTurn ||
                !isMyTurn ||
                isPending ||
                !selectedMove ||
                gameFinished ||
                disabled
              }
              variant={
                selectedMove &&
                isMyTurn &&
                !isPending &&
                !isExecutingTurn &&
                !gameFinished
                  ? 'default'
                  : 'outline'
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
                'Use move'
              )}
            </Button>
          </div>

          <Card className="flex-1 bg-card/30 p-0">
            <CardContent className="p-4">
              {selectedMove ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium flex items-center gap-2">
                      {getIcon(selectedMove.iconName)}
                      {selectedMove.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Swords className="size-4 text-primary" />
                      <span className="text-lg font-medium">
                        {selectedMove.power}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedMove.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[120px] text-center text-muted-foreground">
                  <p>Select a move to see details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isPending && pendingTxHash && (
          <div className="space-y-1">
            <div className="text-xs text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Loader2 className="size-3 animate-spin" />
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
