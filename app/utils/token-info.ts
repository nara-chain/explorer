import { getChainId } from '@entities/chain-id';
import { Connection, PublicKey } from '@solana/web3.js';
import type { ChainId, Client, Token } from '@solflare-wallet/utl-sdk';
import { Cluster } from '@utils/cluster';
import Logger from '@utils/logger';
import { TokenExtension } from '@validators/accounts/token-extension';

type TokenExtensions = {
    readonly website?: string;
    readonly bridgeContract?: string;
    readonly assetContract?: string;
    readonly address?: string;
    readonly explorer?: string;
    readonly twitter?: string;
    readonly github?: string;
    readonly medium?: string;
    readonly tgann?: string;
    readonly tggroup?: string;
    readonly discord?: string;
    readonly serumV3Usdt?: string;
    readonly serumV3Usdc?: string;
    readonly coingeckoId?: string;
    readonly imageUrl?: string;
    readonly description?: string;
};
export type FullLegacyTokenInfo = {
    readonly chainId: number;
    readonly address: string;
    readonly name: string;
    readonly decimals: number;
    readonly symbol: string;
    readonly logoURI?: string;
    readonly tags?: string[];
    readonly extensions?: TokenExtensions;
};
export type FullTokenInfo = FullLegacyTokenInfo & {
    readonly verified: boolean;
};

type FullLegacyTokenInfoList = {
    tokens: FullLegacyTokenInfo[];
};

async function makeUtlClient(
    cluster: Cluster,
    connectionString: string,
    genesisHash?: string
): Promise<Client | undefined> {
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return undefined;

    const { Client, UtlConfig } = await import('@solflare-wallet/utl-sdk');
    const config = new UtlConfig({
        chainId,
        connection: new Connection(connectionString),
    });

    return new Client(config);
}

type TokenInfoOverride = {
    name: string;
    symbol: string;
    logoURI: string;
    decimals: number;
    verified: boolean;
};

const TOKEN_INFO_OVERRIDES: Record<string, TokenInfoOverride> = {
    So11111111111111111111111111111111111111112: {
        decimals: 9,
        logoURI: '/favicon-v3.svg',
        name: 'NARA Wrapped SOL',
        symbol: 'NARA-wNARA',
        verified: true,
    },
};

export function getTokenInfoSwrKey(address: string, cluster: Cluster, genesisHash?: string) {
    return ['get-token-info', address, cluster, genesisHash];
}

export async function getTokenInfo(
    address: PublicKey,
    cluster: Cluster,
    genesisHash?: string
): Promise<Token | undefined> {
    return getTokenInfoWithoutOnChainFallback(address, cluster, genesisHash);
}

/**
 * @deprecated Use `getTokenInfo` instead.
 */
export async function getTokenInfoWithoutOnChainFallback(
    address: PublicKey,
    cluster: Cluster,
    genesisHash?: string
): Promise<Token | undefined> {
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return undefined;

    const override = TOKEN_INFO_OVERRIDES[address.toBase58()];
    if (override) {
        return {
            address: address.toBase58(),
            chainId,
            decimals: override.decimals,
            logoURI: override.logoURI,
            name: override.name,
            symbol: override.symbol,
            verified: override.verified,
        } as Token;
    }

    try {
        const response = await fetch('/api/token-info', {
            body: JSON.stringify({ address: address.toBase58(), cluster, genesisHash }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });

        if (!response.ok) return undefined;

        const data = (await response.json()) as { content?: Token };
        return data.content;
    } catch (error) {
        Logger.warn(`Failed to fetch token info for ${address}`, error);
        return undefined;
    }
}

async function getFullLegacyTokenInfoUsingCdn(
    address: PublicKey,
    chainId: ChainId
): Promise<FullLegacyTokenInfo | undefined> {
    const tokenListResponse = await fetch(
        'https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json'
    );
    if (tokenListResponse.status >= 400) {
        console.error(new Error('Error fetching token list from CDN'));
        return undefined;
    }
    const { tokens } = (await tokenListResponse.json()) as FullLegacyTokenInfoList;
    const tokenInfo = tokens.find(t => t.address === address.toString() && t.chainId === chainId);
    return tokenInfo;
}

export function isRedactedTokenAddress(address: string): boolean {
    return (
        process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
            .map(addr => addr.trim())
            .includes(address) ?? false
    );
}

/**
 * Get the full token info from a CDN with the legacy token list
 * The UTL SDK only returns the most common fields, we sometimes need eg extensions
 * @param address Public key of the token
 * @param cluster Cluster to fetch the token info for
 * @param genesisHash Genesis hash for cluster identification (required for SIMD-296)
 */
export type FullTokenInfoSwrKey = ['get-full-token-info', string, Cluster, string, string | undefined];

export function getFullTokenInfoSwrKey(
    address: string,
    cluster: Cluster,
    url: string,
    genesisHash?: string
): FullTokenInfoSwrKey {
    return ['get-full-token-info', address, cluster, url, genesisHash];
}

export async function fetchFullTokenInfo([_, pubkey, cluster, _url, genesisHash]: FullTokenInfoSwrKey) {
    return await getFullTokenInfo(new PublicKey(pubkey), cluster, genesisHash);
}

export async function getFullTokenInfo(
    address: PublicKey,
    cluster: Cluster,
    genesisHash?: string
): Promise<FullTokenInfo | undefined> {
    if (isRedactedTokenAddress(address.toBase58())) {
        return undefined;
    }
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return undefined;

    const override = TOKEN_INFO_OVERRIDES[address.toBase58()];
    if (override) {
        return {
            address: address.toBase58(),
            chainId,
            decimals: override.decimals,
            logoURI: override.logoURI,
            name: override.name,
            symbol: override.symbol,
            tags: [],
            verified: override.verified,
        };
    }

    const [legacyCdnTokenInfo, sdkTokenInfo] = await Promise.all([
        getFullLegacyTokenInfoUsingCdn(address, chainId),
        getTokenInfo(address, cluster, genesisHash),
    ]);

    if (!sdkTokenInfo) {
        return legacyCdnTokenInfo
            ? {
                  ...legacyCdnTokenInfo,
                  verified: true,
              }
            : undefined;
    }
    // Merge the fields, prioritising the sdk ones which are more up to date
    let tags: string[] = [];
    if (sdkTokenInfo.tags) tags = Array.from(sdkTokenInfo.tags);
    else if (legacyCdnTokenInfo?.tags) tags = legacyCdnTokenInfo.tags;

    return {
        address: sdkTokenInfo.address,
        chainId,
        decimals: sdkTokenInfo.decimals ?? 0,
        extensions: legacyCdnTokenInfo?.extensions || (sdkTokenInfo as { extensions?: TokenExtensions })?.extensions,
        logoURI: sdkTokenInfo.logoURI ?? undefined,
        name: sdkTokenInfo.name,
        symbol: sdkTokenInfo.symbol,
        tags,
        verified: sdkTokenInfo.verified ?? false,
    };
}

export async function getTokenInfos(
    addresses: PublicKey[],
    cluster: Cluster,
    connectionString: string,
    genesisHash?: string
): Promise<Token[] | undefined> {
    const client = await makeUtlClient(cluster, connectionString, genesisHash);
    if (!client) return undefined;
    const tokens = await client.fetchMints(addresses);
    return tokens;
}

export function getCurrentTokenScaledUiAmountMultiplier(extensions: Array<TokenExtension> | undefined): string {
    const scaledUiAmountConfig = extensions?.find(extension => extension.extension === 'scaledUiAmountConfig');
    if (!scaledUiAmountConfig) {
        return '1';
    }
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return currentTimestamp >= scaledUiAmountConfig.state.newMultiplierEffectiveTimestamp
        ? scaledUiAmountConfig.state.newMultiplier
        : scaledUiAmountConfig.state.multiplier;
}
