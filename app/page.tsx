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

const NavLink = ({
  href,
  children,
  active = false,
}: { href: string; children: React.ReactNode; active?: boolean }) => (
  <Link
    href={href}
    className={cn(
      'font-garamond text-[32px] tracking-tighter uppercase text-white transition-opacity',
      !active && 'opacity-50 hover:opacity-70',
    )}
  >
    {children}
  </Link>
);

export default function Page() {
  const { isInitialized, isInitializing } = useAssetHub();
  const [scope, animate] = useAnimate();
  const [showWalletStatus, setShowWalletStatus] = useState(true);

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
      <nav className="absolute top-13 left-1/2 -translate-x-1/2 w-[620px] h-[70px] bg-[#1f1f1f] rounded-full flex items-center justify-center z-50">
        <div className="flex gap-13 items-center">
          <NavLink href="/" active>
            home
          </NavLink>
          <NavLink href="/about">about</NavLink>
          <NavLink href="/contact">contact</NavLink>
          <NavLink href="/dashboard">the app</NavLink>
        </div>
      </nav>

      <motion.div
        // NOTE: z-1 here if i want the text above
        // maybe on mobile i'll make it z-1. on pc z-0 is fine
        className="absolute top-[30vh] left-1/2 -translate-x-1/2 w-full z-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.88, delay: 0.5 }}
      >
        <h1 className="font-garamond text-[15rem] text-white uppercase tracking-tighter text-center leading-[0.8]">
          the best nft
          <br />
          bullshit ever
        </h1>
      </motion.div>

      <Floating sensitivity={-1} className="overflow-hidden">
        {/* Left Column */}
        <FloatingElement depth={2} className="top-[8%] left-[11%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[0]}
            className="w-32 md:w-48 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[40%] left-[2%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[1]}
            className="w-28 md:w-40 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={4} className="top-[73%] left-[15%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[2]}
            className="w-40 md:w-52 aspect-[3/4] object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>

        {/* Center Column */}
        <FloatingElement depth={2} className="top-[5%] left-[40%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[3]}
            className="w-36 md:w-44 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[25%] left-[45%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[4]}
            className="w-24 md:w-32 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={3} className="top-[80%] left-[50%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[5]}
            className="w-32 md:w-40 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>

        {/* Right Column */}
        <FloatingElement depth={2} className="top-[2%] left-[75%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[6]}
            className="w-36 md:w-48 aspect-[3/4] object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[35%] left-[85%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[7]}
            className="w-32 md:w-40 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={3} className="top-[60%] left-[80%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[8]}
            className="w-28 md:w-36 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>

        {/* Additional Images */}
        <FloatingElement depth={2} className="top-[15%] left-[60%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[9]}
            className="w-24 md:w-32 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[65%] left-[30%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={heroImages[10]}
            className="w-28 md:w-36 aspect-square object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-sm"
            alt="NFT artwork"
          />
        </FloatingElement>
      </Floating>

      <motion.button
        type="button"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-52 h-[51px] bg-[#1f1f1f] rounded-full flex items-center justify-center z-50"
        onClick={() =>
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
        }
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        <span className="font-helvetica text-white uppercase tracking-tight">
          Go down or smth
        </span>
      </motion.button>

      <AnimatePresence mode="wait">
        {showWalletStatus && (
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
