'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageStateCardProps {
  // Content
  title?: string;
  message: string;

  // Visual state
  variant?: 'loading' | 'error' | 'info' | 'warning';
  icon?: ReactNode;

  // Action
  buttonText?: string;
  buttonAction?: () => void;
  redirectTo?: string;

  // Styling
  maxWidth?: string;
}

export function PageStateCard({
  title,
  message,
  variant = 'info',
  icon,
  buttonText,
  buttonAction,
  redirectTo,
  maxWidth = 'max-w-md',
}: PageStateCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (buttonAction) {
      buttonAction();
    } else if (redirectTo) {
      router.push(redirectTo);
    }
  };

  const displayIcon =
    icon ??
    (variant === 'loading' ? (
      <Loader2 className="h-8 w-8 animate-spin" />
    ) : null);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className={`w-full ${maxWidth}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            {displayIcon && (
              <div className="mb-4 flex justify-center">{displayIcon}</div>
            )}

            {title && <h2 className="text-xl font-semibold mb-2">{title}</h2>}

            <p className="text-muted-foreground mb-4">{message}</p>

            {buttonText && (
              <Button onClick={handleClick} className="w-full">
                {buttonText}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
