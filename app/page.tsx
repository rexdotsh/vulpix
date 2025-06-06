'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';
import { cn } from '@/lib/utils';
import HeroSection from '@/components/hero/HeroSection';
import AboutSection from '@/components/hero/CircleSection';
import CreateSection from '@/components/hero/CreateSection';

const navItems = [
  { href: '/', label: 'home', active: true },
  { href: '/dashboard', label: 'dashboard' },
  { href: '#about', label: 'about' },
];

const NavLink = ({
  href,
  children,
  active = false,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      'font-garamond tracking-tighter uppercase text-white transition-opacity',
      !active && 'opacity-50 hover:opacity-70',
      className,
    )}
  >
    {children}
  </Link>
);

const MobileNav = ({
  isOpen,
  onClose,
}: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[400px] bg-[#1f1f1f] z-50 flex flex-col items-center justify-center gap-12 px-8"
        >
          <motion.div
            className="absolute top-8 right-8"
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
          >
            <div className="w-8 h-8 relative cursor-pointer">
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-white rotate-45" />
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-white -rotate-45" />
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-12">
            {navItems.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <NavLink
                  href={link.href}
                  active={link.active}
                  onClick={onClose}
                  className="text-5xl font-garamond"
                >
                  {link.label}
                </NavLink>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="absolute bottom-12 left-0 w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-white/50 text-sm uppercase tracking-widest">
              Navigation
            </div>
          </motion.div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const DesktopNav = () => (
  <nav className="absolute top-13 left-1/2 -translate-x-1/2 w-[620px] h-[70px] bg-[#1f1f1f] rounded-full flex items-center justify-center z-50">
    <div className="flex gap-13 items-center">
      {navItems.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          active={link.active}
          className="text-[32px]"
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default function Page() {
  const { isInitialized, isInitializing } = useAssetHub();
  const [showWalletStatus, setShowWalletStatus] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => {
        setShowWalletStatus(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  const getWalletContent = () => {
    if (isInitializing) {
      return (
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.span
            className="inline-block rounded-full h-4 w-4 border-2 border-white mr-2"
            animate={{
              rotate: 360,
              borderTopColor: 'transparent',
              borderRightColor: 'rgba(255,255,255,0.5)',
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1,
              ease: 'linear',
            }}
          />
          <span className="text-white">Initializing AssetHub...</span>
        </motion.div>
      );
    }

    if (isInitialized) {
      return (
        <motion.div
          className="flex items-center text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative mr-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.circle
                cx="10"
                cy="10"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-green-500"
              />
              <motion.path
                d="M6 10.5L8.5 13L14 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-green-500"
              />
            </svg>
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            Connected Successfully
          </motion.span>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="relative">
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="fixed top-6 right-6 z-50 w-12 h-12 flex flex-col justify-center items-center gap-1.5 bg-[#1f1f1f]/90 backdrop-blur-sm rounded-full hover:scale-110 transition-transform"
          >
            <span className="w-5 h-0.5 bg-white rounded-full transition-transform" />
            <span className="w-5 h-0.5 bg-white rounded-full transition-transform" />
            <span className="w-5 h-0.5 bg-white rounded-full transition-transform" />
          </button>
          <MobileNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
      ) : (
        <DesktopNav />
      )}

      <AnimatePresence mode="wait">
        {showWalletStatus && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className="fixed top-4 right-4 bg-[#1f1f1f] px-4 py-2 rounded-full z-50 flex items-center min-w-[200px] justify-center"
          >
            {getWalletContent()}
          </motion.div>
        )}
      </AnimatePresence>

      <HeroSection />
      <AboutSection />
      <CreateSection />
    </div>
  );
}
