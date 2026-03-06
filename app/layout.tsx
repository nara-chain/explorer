import './scss/theme-dark.scss';
import './styles.css';

import { ClusterModal } from '@components/ClusterModal';
import { ClusterStatusButton } from '@components/ClusterStatusButton';
import { MessageBanner } from '@components/MessageBanner';
import { Navbar } from '@components/Navbar';
import { ClusterProvider } from '@providers/cluster';
import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { Toaster } from '@shared/ui/sonner/toaster';
import { isEnvEnabled } from '@utils/env';
import { BotIdClient } from 'botid/client';
import type { Viewport } from 'next';
import dynamic from 'next/dynamic';
import { JetBrains_Mono } from 'next/font/google';
import { Metadata } from 'next/types';

import { TokenInfoBatchProvider } from '@/app/entities/token-info/model/token-info-batch-provider';
import { CookieConsent } from '@/app/features/cookie';
import { VisibilityProvider } from '@/app/shared/lib/visibility';

import { botIdProtectedRoutes } from '../middleware';

const SearchBar = dynamic(() => import('@components/SearchBar'), {
    ssr: false,
});

export const metadata: Metadata = {
    description: 'Inspect transactions, accounts, blocks, and more on the Solana blockchain',
    manifest: '/manifest.json',
    title: 'Explorer | Solana',
};

export const viewport: Viewport = {
    initialScale: 1,
    maximumScale: 1,
    width: 'device-width',
};

const jetbrainsMonoFont = JetBrains_Mono({
    display: 'swap',
    subsets: ['latin'],
    variable: '--explorer-default-font',
    weight: ['400', '500', '700', '800'],
});

export default function RootLayout({ analytics, children }: { analytics: React.ReactNode; children: React.ReactNode }) {
    return (
        <html lang="en" className={`${jetbrainsMonoFont.variable}`}>
            <head>
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <BotIdClient
                    protect={isEnvEnabled(process.env.NEXT_PUBLIC_BOTID_ENABLED) ? botIdProtectedRoutes : []}
                />
            </head>
            <body>
                <ScrollAnchorProvider>
                    <ClusterProvider>
                        <VisibilityProvider>
                            <TokenInfoBatchProvider>
                                <ClusterModal />
                                <div className="main-content pb-4">
                                    <Navbar>
                                        <SearchBar />
                                    </Navbar>
                                    <MessageBanner />
                                    <div className="container my-3 d-xl-none">
                                        <SearchBar />
                                    </div>
                                    <div className="container my-3 d-lg-none">
                                        <ClusterStatusButton />
                                    </div>
                                    {children}
                                </div>
                                <Toaster position="bottom-center" toastOptions={{ duration: 5_000 }} />
                            </TokenInfoBatchProvider>
                        </VisibilityProvider>
                    </ClusterProvider>
                </ScrollAnchorProvider>
                {analytics}
                <CookieConsent />
            </body>
        </html>
    );
}
