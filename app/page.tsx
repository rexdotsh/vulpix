'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, stagger, useAnimate, AnimatePresence } from 'motion/react';
import { useAssetHub } from '@/lib/providers/AssetHubProvider';
import { cn } from '@/lib/utils';
import Floating, { FloatingElement } from '@/components/parallax-floating';

const heroImages = Array.from(
  { length: 11 },
  (_, i) => `/hero-parallax/${(i + 1).toString().padStart(2, '0')}.png`,
);

const navItems = [
  { href: '/', label: 'home', active: true },
  { href: '/about', label: 'about' },
  { href: '/contact', label: 'contact' },
  { href: '/dashboard', label: 'the app' },
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
  const [scope, animate] = useAnimate();
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
    animate(
      'img',
      { opacity: [0, 1] },
      { duration: 0.5, delay: stagger(0.15) },
    );
  }, [animate]);

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
    <div
      className="relative min-h-screen bg-background overflow-hidden"
      ref={scope}
    >
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

      <motion.div
        className="absolute top-[25vh] md:top-[30vh] left-1/2 -translate-x-1/2 w-full z-[1] md:z-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.88, delay: 0.5 }}
      >
        <h1 className="font-garamond text-[7rem] md:text-[15rem] text-white uppercase tracking-tighter text-center leading-[0.8] px-4 md:px-0">
          the best nft
          <br />
          bullshit ever
        </h1>
      </motion.div>

      <Floating sensitivity={isMobile ? -0.5 : -1} className="overflow-hidden">
        {/* Left Column */}
        <FloatingElement depth={2} className="top-[8%] left-[5%] md:left-[11%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[0]}
            className="w-20 sm:w-32 md:w-48 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[40%] left-[2%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[1]}
            className="w-16 sm:w-28 md:w-40 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement
          depth={4}
          className="top-[73%] left-[8%] md:left-[15%]"
        >
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[2]}
            className="w-24 sm:w-40 md:w-52 aspect-[3/4] object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>

        {/* Center Column */}
        <FloatingElement depth={2} className="top-[5%] left-[40%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[3]}
            className="w-20 sm:w-36 md:w-44 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[25%] left-[45%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[4]}
            className="w-16 sm:w-24 md:w-32 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={3} className="top-[80%] left-[50%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[5]}
            className="w-20 sm:w-32 md:w-40 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>

        {/* Right Column */}
        <FloatingElement
          depth={2}
          className="top-[2%] left-[70%] md:left-[75%]"
        >
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[6]}
            className="w-20 sm:w-36 md:w-48 aspect-[3/4] object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement
          depth={1}
          className="top-[35%] left-[80%] md:left-[85%]"
        >
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[7]}
            className="w-20 sm:w-32 md:w-40 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement
          depth={3}
          className="top-[60%] left-[75%] md:left-[80%]"
        >
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[8]}
            className="w-16 sm:w-28 md:w-36 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>

        {/* Additional Images */}
        <FloatingElement depth={2} className="top-[15%] left-[60%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[9]}
            className="w-16 sm:w-24 md:w-32 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[65%] left-[30%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[10]}
            className="w-16 sm:w-28 md:w-36 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
      </Floating>

      {(!isMobile || !isMenuOpen) && (
        <motion.button
          type="button"
          className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-40 md:w-52 h-[40px] md:h-[51px] bg-[#1f1f1f] rounded-full flex items-center justify-center z-50"
          onClick={() =>
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
          }
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <span className="font-helvetica text-white uppercase tracking-tight text-sm md:text-base">
            Go down or smth
          </span>
        </motion.button>
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
    </div>
  );
}
