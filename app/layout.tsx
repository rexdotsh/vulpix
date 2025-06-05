import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PolkadotProvider } from '@/lib/providers/PolkadotProvider';
import { AssetHubProvider } from '@/lib/providers/AssetHubProvider';
import { ConvexClientProvider } from '@/lib/providers/ConvexClientProvider';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <PolkadotProvider>
            <AssetHubProvider>
              <Navbar />
              <Toaster richColors position="top-center" />
              {children}
            </AssetHubProvider>
          </PolkadotProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
