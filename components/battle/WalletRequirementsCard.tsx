import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTalismanWallet } from '@/hooks/useTalismanWallet';
import { useWalletRequirements } from '@/lib/hooks/useWalletRequirements';
import { Loader2, AlertCircle, ExternalLink, Check } from 'lucide-react';

interface WalletRequirement {
  key: string;
  label: string;
  status: 'connected' | 'required' | 'switching';
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
}

interface WalletRequirementsCardProps {
  onLinkWallet?: () => void;
  compact?: boolean;
}

export function WalletRequirementsCard({
  onLinkWallet,
  compact = false,
}: WalletRequirementsCardProps) {
  const { requirements } = useWalletRequirements();
  const {
    connectWallet,
    switchToAssetHubNetwork,
    isCheckingNetwork,
    isSwitchingNetwork,
  } = useTalismanWallet();

  const getRequirements = (): WalletRequirement[] => [
    {
      key: 'talisman',
      label: 'Talisman Wallet',
      status: requirements.talismanConnected ? 'connected' : 'required',
      action: !requirements.talismanConnected
        ? {
            label: 'Connect',
            onClick: connectWallet,
          }
        : undefined,
    },
    {
      key: 'network',
      label: 'AssetHub Network',
      status: requirements.networkCorrect
        ? 'connected'
        : isSwitchingNetwork
          ? 'switching'
          : 'required',
      action: !requirements.networkCorrect
        ? {
            label: 'Switch',
            onClick: switchToAssetHubNetwork,
            loading: isSwitchingNetwork,
          }
        : undefined,
    },
    {
      key: 'linking',
      label: 'Wallet Linking',
      status: requirements.walletsLinked ? 'connected' : 'required',
      action:
        !requirements.walletsLinked && onLinkWallet
          ? {
              label: 'Link',
              onClick: onLinkWallet,
            }
          : undefined,
    },
  ];

  const requirementsList = getRequirements();

  if (compact) {
    return (
      <div className="space-y-2">
        {requirementsList.map((req) => (
          <div
            key={req.key}
            className="flex items-center justify-between p-2 bg-muted/50 rounded"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  req.status === 'connected'
                    ? 'bg-green-500'
                    : req.status === 'switching'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-sm">{req.label}</span>
              {req.key === 'network' && isCheckingNetwork && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={req.status === 'connected' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {req.status === 'connected'
                  ? 'Ready'
                  : req.status === 'switching'
                    ? 'Switching...'
                    : 'Required'}
              </Badge>
              {req.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={req.action.onClick}
                  disabled={req.action.loading}
                >
                  {req.action.loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    req.action.label
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}

        {!requirements.talismanInstalled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Talisman extension required</span>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://talisman.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Install <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requirementsList.map((req) => (
        <div
          key={req.key}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                req.status === 'connected' ? 'bg-primary/10' : 'bg-muted'
              }`}
            >
              {req.status === 'connected' ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">{req.label}</p>
              <p className="text-sm text-muted-foreground">
                {req.status === 'connected'
                  ? 'Ready'
                  : req.status === 'switching'
                    ? 'Switching...'
                    : 'Required'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={req.status === 'connected' ? 'default' : 'secondary'}
            >
              {req.status === 'connected' ? 'Connected' : 'Required'}
            </Badge>
            {req.action && (
              <Button
                size="sm"
                variant="outline"
                onClick={req.action.onClick}
                disabled={req.action.loading}
              >
                {req.action.loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {req.action.label}ing...
                  </>
                ) : (
                  req.action.label
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
