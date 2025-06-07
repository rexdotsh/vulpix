'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Swords, Home, Sparkles } from 'lucide-react';
import { WalletConnection } from '@/components/WalletConnection';
import { useState, useLayoutEffect } from 'react';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  type Variants,
} from 'framer-motion';
import { useDebounceCallback } from 'usehooks-ts';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Generate', href: '/generate', icon: Sparkles },
  { name: 'Battle', href: '/battle', icon: Swords },
];

export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [maxWidth, setMaxWidth] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);

  // scroll threshold
  const threshold = 50;

  const debounced = useDebounceCallback((latest: number) => {
    // show/hide navbar based on scroll direction
    if (latest > lastScrollY && latest > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    // transform navbar based on scroll position
    setIsScrolled(latest > threshold);
    setLastScrollY(latest);
  }, 50);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    debounced(latest);
  });

  const calcMaxWidth = () => {
    const clientWidth = window.innerWidth;

    if (clientWidth >= 768) {
      setMaxWidth('1440px');
    } else if (clientWidth >= 640) {
      setMaxWidth('1024px');
    } else {
      setMaxWidth('100%');
    }
  };

  // handle client-side mounting to prevent hydration issues
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    calcMaxWidth();
    window.addEventListener('resize', calcMaxWidth);
    return () => {
      window.removeEventListener('resize', calcMaxWidth);
    };
  }, []);

  // don't render navbar on home page, but only after mounting
  if (!mounted || pathname === '/') {
    return null;
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  // navbar variants following the reference pattern
  const navVariants: Variants = {
    expanded: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      backdropFilter: 'blur(8px)',
      top: 0,
      maxWidth,
      borderRadius: 0,
      border: '0px solid transparent',
      boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
    },
    compact: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(24px)',
      top: '16px',
      maxWidth: '900px',
      borderRadius: 16,
      border: '2px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
  };

  return (
    <motion.nav
      initial="expanded"
      animate={isVisible ? (isScrolled ? 'compact' : 'expanded') : 'hidden'}
      variants={{
        ...navVariants,
        hidden: { opacity: 0, y: -25, pointerEvents: 'none' },
        expanded: {
          ...navVariants.expanded,
          opacity: 1,
          pointerEvents: 'auto',
        },
        compact: { ...navVariants.compact, opacity: 1, pointerEvents: 'auto' },
      }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut',
        backgroundColor: { type: 'spring', stiffness: 600, damping: 25 },
        top: { type: 'spring', stiffness: 600, damping: 25 },
        maxWidth: { type: 'spring', stiffness: 600, damping: 25 },
        borderRadius: { type: 'spring', stiffness: 600, damping: 25 },
      }}
      className={cn(
        'fixed z-50 flex items-center w-full',
        'left-1/2 transform -translate-x-1/2',
        'transition-all duration-200 ease-in-out',
        isScrolled ? 'h-14 px-6' : 'h-16 px-4',
      )}
    >
      <div className="flex items-center justify-between w-full h-full gap-4">
        {/* Left section: Logo */}
        <div className="flex-1 flex justify-start">
          <Link
            href="/"
            className="flex items-center shrink-0 hover:scale-110 transition-transform duration-150"
          >
            <span
              className={cn(
                'font-bold bg-gradient-to-r text-white bg-clip-text transition-all duration-200',
                isScrolled ? 'text-lg' : 'text-xl',
              )}
            >
              Vulpix
            </span>
          </Link>
        </div>

        {/* Center section: Navigation */}
        <div className="flex-none flex items-center justify-center gap-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-xl transition-all duration-150 group relative',
                'hover:scale-105 active:scale-95',
                isScrolled ? 'p-2.5' : 'px-3 py-2 space-x-2',
                isActive(item.href)
                  ? 'text-primary-foreground bg-primary/90 shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
              )}
              title={isScrolled ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'shrink-0 transition-all duration-150',
                  isScrolled ? 'w-5 h-5' : 'w-4 h-4',
                )}
              />
              {!isScrolled && (
                <span className="text-sm font-medium transition-all duration-150">
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right section: Wallet */}
        <div className="flex-1 flex justify-end">
          <div
            className={cn(
              'relative shrink-0 transition-all duration-200',
              isScrolled ? 'scale-90' : 'scale-100',
            )}
            style={{ zIndex: 100 }}
          >
            <div className="relative">
              <WalletConnection />
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
