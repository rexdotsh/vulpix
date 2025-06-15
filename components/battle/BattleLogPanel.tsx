import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Swords, Trophy, Clock, Hash, Zap } from 'lucide-react';
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
              <div className="space-y-2 pr-4">
                {moves
                  .slice(-10)
                  .reverse()
                  .map((move, index) => {
                    const isEnemyMove = move.player === player2Address;
                    const themeColors = isEnemyMove
                      ? {
                          primary: 'destructive',
                          primaryBg: 'bg-destructive',
                          primaryText: 'text-destructive',
                          primaryBgSubtle: 'bg-destructive/10',
                          primaryBgHover: 'hover:bg-destructive/20',
                        }
                      : {
                          primary: 'primary',
                          primaryBg: 'bg-primary',
                          primaryText: 'text-primary',
                          primaryBgSubtle: 'bg-primary/10',
                          primaryBgHover: 'hover:bg-primary/20',
                        };

                    return (
                      <div
                        key={`${move.turnNumber}-${index}`}
                        className="group relative bg-gradient-to-r from-muted/80 to-muted/40 border border-border/50 rounded-lg p-3 hover:shadow-md"
                      >
                        {/* Turn number badge */}
                        <div
                          className={`absolute -top-1 -left-1 ${themeColors.primaryBg} text-primary-foreground text-xs font-mono px-2 py-0.5 rounded-full shadow-sm`}
                        >
                          T{move.turnNumber}
                        </div>

                        {/* Transaction hash - prominent display */}
                        <div className="flex items-center justify-between mb-3 mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Hash className="size-3" />
                            <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded font-mono">
                              {move.txHash.slice(0, 8)}...
                              {move.txHash.slice(-6)}
                            </code>
                          </div>
                          <Link
                            href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${move.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 ${themeColors.primaryBgSubtle} ${themeColors.primaryBgHover} ${themeColors.primaryText} px-2 py-1 rounded-md transition-colors text-xs font-medium group/link`}
                          >
                            View
                            <ExternalLink className="size-3 group-hover/link:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>

                        {/* Player action */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`size-2 ${themeColors.primaryBg} rounded-full`}
                            />
                            <span className="text-sm font-medium">
                              {getPlayerDisplayName(
                                move.player,
                                move.player === player1Address
                                  ? player1Name
                                  : player2Name,
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              used
                            </span>
                            <Badge
                              variant={isEnemyMove ? 'destructive' : 'default'}
                              className="text-xs font-medium"
                            >
                              {move.action}
                            </Badge>
                          </div>

                          {/* Damage info */}
                          {move.damage && (
                            <div className="flex items-center gap-2 text-sm">
                              <div
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${themeColors.primaryBgSubtle} ${themeColors.primaryText}`}
                              >
                                {move.wasCritical ? (
                                  <Zap className="size-3 fill-current" />
                                ) : (
                                  <Swords className="size-3" />
                                )}
                                <span className="font-medium">
                                  {move.damage}
                                </span>
                                <span className="text-xs opacity-75">dmg</span>
                              </div>
                              {move.wasCritical && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs font-bold animate-pulse"
                                >
                                  CRIT!
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Subtle border effect on hover */}
                        <div
                          className={`absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                            isEnemyMove
                              ? 'from-destructive/0 via-destructive/5 to-destructive/0'
                              : 'from-primary/0 via-primary/5 to-primary/0'
                          }`}
                        />
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex-shrink-0">
          <Separator className="mb-4" />

          <div className="bg-gradient-to-r from-muted/60 to-muted/30 border border-border/50 rounded-lg p-4 space-y-3">
            {/* Game Status Header */}
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  gameStatus === 'finished'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary/20 text-secondary'
                }`}
              >
                <Trophy className="size-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Battle Status</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      gameStatus === 'finished' ? 'default' : 'secondary'
                    }
                    className="text-xs font-medium"
                  >
                    {gameStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Current Turn Info */}
            {gameStatus === 'active' && (
              <div className="flex items-center justify-between p-2 bg-muted/40 rounded-md border border-border/30">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2 rounded-full ${
                      currentTurn === player1Address
                        ? 'bg-primary'
                        : 'bg-destructive'
                    }`}
                  />
                  <span className="text-sm font-medium">Current Turn:</span>
                </div>
                <Badge
                  variant={
                    currentTurn === player1Address ? 'default' : 'destructive'
                  }
                  className="text-xs"
                >
                  {getPlayerDisplayName(
                    currentTurn,
                    currentTurn === player1Address ? player1Name : player2Name,
                  )}
                </Badge>
              </div>
            )}

            {/* Turn Counter */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>
                Turn {turnNumber} • {moves.length} moves played
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
