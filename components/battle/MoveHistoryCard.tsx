import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface Move {
  turnNumber: number;
  player: string;
  action: string;
  damage?: number;
  wasCritical?: boolean;
  txHash: string;
}

interface MoveHistoryCardProps {
  moves: Move[];
}

export function MoveHistoryCard({ moves }: MoveHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Battle Log</CardTitle>
        <CardDescription>Recent moves and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {moves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No moves yet. The battle is about to begin!
            </p>
          ) : (
            moves
              .slice(-10)
              .reverse()
              .map((move, index) => (
                <div
                  key={`${move.turnNumber}-${index}`}
                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Turn {move.turnNumber}:</span>
                    <span>
                      {move.player.slice(0, 6)}... {move.action}
                    </span>
                    {move.damage && (
                      <Badge
                        variant={move.wasCritical ? 'destructive' : 'secondary'}
                      >
                        {move.damage} dmg {move.wasCritical && '(CRIT!)'}
                      </Badge>
                    )}
                  </div>
                  <Link
                    href={`https://blockscout-asset-hub.parity-chains-scw.parity.io/tx/${move.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
