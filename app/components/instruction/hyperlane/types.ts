import { TransactionInstruction } from '@solana/web3.js';

/**
 * Hyperlane bridge programs deployed for Nara <-> Solana.
 * Reference: nara-hyperlane/bridge-sdk-guide.md
 */

export const HYPERLANE_NOOP_ADDRESS = 'noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV';

export type HyperlaneAsset = 'USDC' | 'USDT' | 'SOL';
export type HyperlaneSide = 'nara' | 'solana';
export type HyperlaneWarpMode = 'collateral' | 'synthetic' | 'native';

export type HyperlaneWarpRouteInfo = {
    asset: HyperlaneAsset;
    side: HyperlaneSide;
    mode: HyperlaneWarpMode;
    /** Decimals of the warp route token. Used to format `amount_or_id`. */
    decimals: number;
    /** Mint pubkey if any. Native (Solana SOL) has no mint. */
    mint?: string;
    /** Display label e.g. "Nara wUSDC" used in instruction headers. */
    label: string;
};

export const HYPERLANE_WARP_ROUTES: Record<string, HyperlaneWarpRouteInfo> = {
    '2q5HJaaagMxBM7GD5yR55xHN4tDZMh1gYraG1Y4wbry6': {
        asset: 'USDT',
        decimals: 6,
        label: 'USDT (Hyperlane)',
        mint: '8yQSyqC85A9Vcqz8gTU2Bk5Y63bnC5378sgx1biTKsjd',
        mode: 'synthetic',
        side: 'nara',
    },
    '46MmAWwKRAt9uvn7m44NXbVq2DCWBQE2r1TDw25nyXrt': {
        asset: 'SOL',
        decimals: 9,
        label: 'SOL',
        mode: 'native',
        side: 'solana',
    },
    '4GcZJTa8s9vxtTz97Vj1RrwKMqPkT3DiiJkvUQDwsuZP': {
        asset: 'USDC',
        decimals: 6,
        label: 'USDC',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        mode: 'collateral',
        side: 'solana',
    },
    '6bKmjEMbjcJUnqAiNw7AXuMvUALzw5XRKiV9dBsterxg': {
        asset: 'SOL',
        decimals: 9,
        label: 'SOL (Hyperlane)',
        mint: '7fKh7DqPZmsYPHdGvt9Qw2rZkSEGp9F5dBa3XuuuhavU',
        mode: 'synthetic',
        side: 'nara',
    },
    BC2j6WrdPs9xhU9CfBwJsYSnJrGq5Tcm4SEen9ENv7go: {
        asset: 'USDC',
        decimals: 6,
        label: 'USDC (Hyperlane)',
        mint: '8P7UGWjq86N3WUmwEgKeGHJZLcoMJqr5jnRUmeBN7YwR',
        mode: 'synthetic',
        side: 'nara',
    },
    DCTt9H3pwwU89qC3Z4voYNThZypV68AwhYNzMNBxWXoy: {
        asset: 'USDT',
        decimals: 6,
        label: 'USDT',
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        mode: 'collateral',
        side: 'solana',
    },
};

export type HyperlaneMailboxInfo = {
    side: HyperlaneSide;
    label: string;
};

export const HYPERLANE_MAILBOXES: Record<string, HyperlaneMailboxInfo> = {
    E588QtVUvresuXq2KoNEwAmoifCzYGpRBdHByN9KQMbi: { label: 'Solana Mailbox', side: 'solana' },
    EjtLD3MCBJregFKAce2pQqPtSnnmBWK5oAZ3wBifHnaH: { label: 'Nara Mailbox', side: 'nara' },
};

export type HyperlaneInfraKind = 'multisig-ism' | 'validator-announce' | 'igp';

export type HyperlaneInfraInfo = {
    kind: HyperlaneInfraKind;
    side: HyperlaneSide;
    label: string;
};

export const HYPERLANE_INFRA_PROGRAMS: Record<string, HyperlaneInfraInfo> = {
    '2XenrKdmacQqSn3VAF9nbZNfhbe6YR2Way1WJmSL5Yrj': {
        kind: 'multisig-ism',
        label: 'Nara Multisig ISM',
        side: 'nara',
    },
    '6ExBzNNba9vAKMZyXfwE9CsTJmKsXPpdaQC4HxeUUQEJ': {
        kind: 'multisig-ism',
        label: 'Solana Multisig ISM',
        side: 'solana',
    },
    BKcYMcQgpBHnrkSs1aMB4hzNwvdKf2DuKWFL59dV6j1o: {
        kind: 'validator-announce',
        label: 'Nara Validator Announce',
        side: 'nara',
    },
    Db1U66V3Kn9B8XgQu5tGcPUYcmH4ZS8Vi4zLXfVJrJEa: {
        kind: 'igp',
        label: 'Nara Interchain Gas Paymaster',
        side: 'nara',
    },
};

export function getHyperlaneInfra(programId: string): HyperlaneInfraInfo | undefined {
    return HYPERLANE_INFRA_PROGRAMS[programId];
}

/** Format a raw integer amount as a decimal string. */
export function formatTokenAmount(raw: bigint, decimals?: number): string {
    if (decimals === undefined) return raw.toString();
    const base = 10n ** BigInt(decimals);
    const whole = raw / base;
    const frac = raw % base;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(decimals, '0');
    let end = fracStr.length;
    while (end > 0 && fracStr[end - 1] === '0') end--;
    return `${whole.toString()}.${fracStr.slice(0, end)}`;
}

export function assetSymbol(route: HyperlaneWarpRouteInfo): string {
    return route.asset;
}

/**
 * Returns the address used to link the warp route's asset label.
 * For mint-backed routes (collateral / synthetic) this is the mint pubkey; for
 * native plugin (Solana SOL) it falls back to the warp route program itself.
 */
export function getAssetLinkAddress(route: HyperlaneWarpRouteInfo, programId: string): string {
    return route.mint ?? programId;
}

export function isHyperlaneInfraInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() in HYPERLANE_INFRA_PROGRAMS;
}

export const HYPERLANE_DOMAINS: Record<number, string> = {
    1399811149: 'Solana',
    40778959: 'Nara',
};

/** Warp route instruction discriminator: 8 bytes of `0x01`. */
export const HYPERLANE_WARP_DISCRIMINATOR = Buffer.from([1, 1, 1, 1, 1, 1, 1, 1]);

export function getHyperlaneWarpRoute(programId: string): HyperlaneWarpRouteInfo | undefined {
    return HYPERLANE_WARP_ROUTES[programId];
}

export function getHyperlaneMailbox(programId: string): HyperlaneMailboxInfo | undefined {
    return HYPERLANE_MAILBOXES[programId];
}

export function isHyperlaneWarpInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() in HYPERLANE_WARP_ROUTES;
}

export function isHyperlaneMailboxInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() in HYPERLANE_MAILBOXES;
}

export function isHyperlaneNoopInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === HYPERLANE_NOOP_ADDRESS;
}

export function getHyperlaneDomainName(domain: number): string {
    return HYPERLANE_DOMAINS[domain] ?? `Domain ${domain}`;
}
