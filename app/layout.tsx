import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { PolkadotProvider } from '@/lib/providers/PolkadotProvider';
import { AssetHubProvider } from '@/lib/providers/AssetHubProvider';
import { ConvexClientProvider } from '@/lib/providers/ConvexClientProvider';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/Navbar';
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const garamond = localFont({
  src: './fonts/ITCGaramondStd-LtCond.woff2',
  variable: '--font-garamond',
  weight: '300',
  style: 'normal',
  display: 'fallback',
});

const megazoid = localFont({
  src: './fonts/Megazoid-Regular.woff2',
  variable: '--font-megazoid',
  weight: '400',
  style: 'normal',
  display: 'fallback',
});

export const metadata: Metadata = {
  title: 'Vulpix',
  description: 'NFT Hub powered by Polkadot AssetHub and PolkaVM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${garamond.variable} ${megazoid.variable} antialiased`}
      >
        <ConvexClientProvider>
          <PolkadotProvider>
            <AssetHubProvider>
              <Navbar />
              <Toaster richColors position="top-center" />
              {children}
              <Analytics basePath="/monitor" />
            </AssetHubProvider>
          </PolkadotProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
