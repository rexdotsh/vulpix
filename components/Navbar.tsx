'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Swords, Home, Sparkles } from 'lucide-react';
import { WalletConnection } from '@/components/WalletConnection';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Generate',
    href: '/generate',
    icon: Sparkles,
  },
  {
    name: 'Battle Arena',
    href: '/battle',
    icon: Swords,
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl bg-gradient-to-r text-white bg-clip-text">
                Vulpix
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <WalletConnection />
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                    title={item.name}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
            <WalletConnection />
          </div>
        </div>
      </div>
    </nav>
  );
}
