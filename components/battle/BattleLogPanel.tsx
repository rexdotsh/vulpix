import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Swords, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import { getPlayerDisplayName } from '@/lib/battle-utils';

interface BattleMove {
  turnNumber: number;
  player: string;
  action: string;
  damage?: number;
  wasCritical?: boolean;
  txHash: string;
  timestamp: number;
}

interface BattleLogPanelProps {
  moves: BattleMove[];
  gameStatus: string;
  currentTurn: string;
  turnNumber: number;
  player1Address: string;
  player2Address: string;
  player1Name?: string;
  player2Name?: string;
}

export function BattleLogPanel({
  moves,
  gameStatus,
  currentTurn,
  turnNumber,
  player1Address,
  player2Address,
  player1Name,
  player2Name,
}: BattleLogPanelProps) {
  return (
    <Card className="w-96 m-6 mr-6 rounded-2xl overflow-hidden h-[calc(100vh-3rem)]">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Battle Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 h-full flex flex-col">
        {/* Move History Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {moves.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <h4 className="text-2xl font-medium">Ready to Battle!</h4>
              <p className="text-xs text-muted-foreground">
                No moves yet. Make the first move!
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {moves
                  .slice(-10)
                  .reverse()
                  .map((move, index) => (
                    <Card
                      key={`${move.turnNumber}-${index}`}
                      className="bg-muted"
                    >
                      <CardContent className="p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            Turn {move.turnNumber}
                          </span>
                          <Link
                            href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${move.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>
                        <div className="text-left space-y-1">
                          <p className="font-medium">
                            {getPlayerDisplayName(
                              move.player,
                              move.player === player1Address
                                ? player1Name
                                : player2Name,
                            )}{' '}
                            used{' '}
                            <span className="text-primary">{move.action}</span>
                          </p>
                          {move.damage && (
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Swords className="size-3" />
                              {move.damage} damage{' '}
                              {move.wasCritical && '(Critical Hit!)'}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Game Status */}
        <div className="flex-shrink-0">
          <Separator className="mb-4" />

          <Alert
            className={
              gameStatus === 'finished'
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-blue-500/50 bg-blue-500/10'
            }
          >
            <Trophy className="size-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Game Status:</span>
                  <Badge
                    variant={
                      gameStatus === 'finished' ? 'default' : 'secondary'
                    }
                  >
                    {gameStatus}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Turn:
                  </span>
                  <span className="font-mono">{turnNumber}</span>
                </div>
                {gameStatus === 'active' && (
                  <div className="flex justify-between items-center">
                    <span>Current Player:</span>
                    <Badge variant="outline" className="text-xs">
                      {getPlayerDisplayName(
                        currentTurn,
                        currentTurn === player1Address
                          ? player1Name
                          : player2Name,
                      )}
                    </Badge>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
