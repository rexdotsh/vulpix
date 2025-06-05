import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Swords, ExternalLink } from 'lucide-react';

interface BattleHeaderProps {
  title: string;
  backHref: string;
  backLabel: string;
  battleId?: string;
  txHash?: string;
  status?: string;
  turnNumber?: number;
}

export function BattleHeader({
  title,
  backHref,
  backLabel,
  battleId,
  txHash,
  status,
  turnNumber,
}: BattleHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              <span className="font-semibold">{title}</span>
              {battleId && <Badge variant="outline">{battleId}</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {txHash && (
              <Link
                href={`https://blockscout-asset-hub.parity-chains-scw.parity.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {status && (
              <Badge
                variant={status === 'finished' ? 'destructive' : 'default'}
              >
                {status === 'finished'
                  ? 'Finished'
                  : turnNumber
                    ? `Turn ${turnNumber}`
                    : status}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
