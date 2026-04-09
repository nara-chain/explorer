'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="nara-footer">
            <div className="container">
                <div className="nara-footer__inner">
                    <div className="nara-footer__brand">
                        <Link href="/" className="nara-footer__logo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/favicon-v3.svg" alt="NARA" width={18} height={18} />
                            <span className="nara-footer__logo-text">NARA</span>
                        </Link>
                        <div className="nara-footer__copyright">&copy; 2026 Nara Network Foundation</div>
                        <div className="nara-footer__tagline">
                            The agent-native Layer 1.<span className="nara-footer__cursor" />
                        </div>
                    </div>
                    <div className="nara-footer__links">
                        <a href="https://nara.build/blog" target="_blank" rel="noopener noreferrer">
                            Blog
                        </a>
                        <a href="https://nara.build/press" target="_blank" rel="noopener noreferrer">
                            Press
                        </a>
                        <a href="https://discord.gg/aeNMBjkWsh" target="_blank" rel="noopener noreferrer">
                            Discord
                        </a>
                        <a href="https://t.me/narabuild" target="_blank" rel="noopener noreferrer">
                            Telegram
                        </a>
                        <Link href="/tos">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
