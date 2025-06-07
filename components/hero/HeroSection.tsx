'use client';

import { useEffect } from 'react';
import { motion, stagger, useAnimate } from 'motion/react';
import Floating, {
  FloatingElement,
} from '@/components/fancy/parallax-floating';
import useScreenSize from '@/hooks/use-screen-size';

const heroImages = Array.from(
  { length: 11 },
  (_, i) => `/hero-parallax/${(i + 1).toString().padStart(2, '0')}.png`,
);

export default function HeroSection() {
  const [scope, animate] = useAnimate();
  const screenSize = useScreenSize();

  useEffect(() => {
    animate(
      'img',
      { opacity: [0, 1] },
      { duration: 0.5, delay: stagger(0.15) },
    );
  }, [animate]);

  const scrollToNext = () => {
    const nextSection = document.getElementById('about');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="relative min-h-screen bg-background overflow-hidden"
      ref={scope}
    >
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

      <Floating
        sensitivity={screenSize.lessThan('md') ? -0.5 : -1}
        className="overflow-hidden"
      >
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
        <FloatingElement depth={1} className="top-[23%] left-[35%]">
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

      <motion.button
        type="button"
        className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-40 md:w-52 h-[40px] md:h-[51px] bg-[#1f1f1f] rounded-full flex items-center justify-center z-50"
        onClick={scrollToNext}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        <span className="text-white uppercase tracking-tight text-lg md:text-base">
          check it out
        </span>
      </motion.button>
    </div>
  );
}
