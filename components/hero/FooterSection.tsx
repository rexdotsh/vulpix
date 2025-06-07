'use client';

import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="sticky z-0 bottom-0 left-0 w-full h-screen bg-[#1f1f1f] flex justify-center items-center">
      <div className="relative overflow-hidden w-full h-full flex flex-col justify-center items-center px-8 sm:px-12">
        {/* Main Brand Text */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-[120px] sm:text-[180px] md:text-[240px] lg:text-[320px] xl:text-[400px] font-garamond font-bold uppercase tracking-tighter text-white leading-none select-none">
            VULPIX
          </h1>
          <p className="text-white/70 text-xl sm:text-2xl md:text-3xl font-garamond uppercase tracking-widest mt-4 sm:mt-8">
            The Ultimate Battle Arena
          </p>
        </div>

        {/* Navigation Links - Larger and more prominent */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 md:gap-16 text-white mb-8 sm:mb-12">
          <Link
            href="/"
            className="text-2xl sm:text-3xl md:text-4xl font-garamond tracking-tighter uppercase hover:text-[#1e7a44] transition-all duration-300 hover:scale-110"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-2xl sm:text-3xl md:text-4xl font-garamond tracking-tighter uppercase hover:text-[#1e7a44] transition-all duration-300 hover:scale-110"
          >
            Dashboard
          </Link>
          <Link
            href="/generate"
            className="text-2xl sm:text-3xl md:text-4xl font-garamond tracking-tighter uppercase hover:text-[#1e7a44] transition-all duration-300 hover:scale-110"
          >
            Generate
          </Link>
          <Link
            href="/battle"
            className="text-2xl sm:text-3xl md:text-4xl font-garamond tracking-tighter uppercase hover:text-[#1e7a44] transition-all duration-300 hover:scale-110"
          >
            Battle
          </Link>
        </div>

        {/* Social Links */}
        <div className="flex gap-6 sm:gap-8 text-white/60">
          <a
            href="https://github.com/rexdotsh/vulpix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg sm:text-xl font-garamond uppercase tracking-wider hover:text-white transition-all duration-300 hover:scale-110"
          >
            Github
          </a>
          <a
            href="https://deepwiki.com/rexdotsh/vulpix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg sm:text-xl font-garamond uppercase tracking-wider hover:text-white transition-all duration-300 hover:scale-110"
          >
            Deepwiki
          </a>
          <Link
            href="#about"
            className="text-lg sm:text-xl font-garamond uppercase tracking-wider hover:text-white transition-all duration-300 hover:scale-110"
          >
            About
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-8 left-8 w-2 h-2 bg-[#1e7a44] rounded-full opacity-70" />
        <div className="absolute top-16 right-12 w-3 h-3 bg-white/20 rounded-full" />
        <div className="absolute bottom-12 left-16 w-1 h-1 bg-[#1e7a44] rounded-full opacity-50" />
        <div className="absolute bottom-8 right-8 w-4 h-4 border border-white/10 rounded-full" />
      </div>
    </footer>
  );
}
