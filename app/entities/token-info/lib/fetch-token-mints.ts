'use server';

import { getChainId } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';

import { UTL_API_BASE_URL } from '../env';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from './errors';
import { type FetchConfig, type TokenInfo } from './types';

const TOKEN_INFO_OVERRIDES: Record<string, Omit<TokenInfo, 'chainId' | 'address'>> = {
    So11111111111111111111111111111111111111112: {
        decimals: 9,
        logoURI: '/favicon-v3.svg',
        name: 'NARA Wrapped SOL',
        symbol: 'NARA-wNARA',
        verified: true,
    },
};

function applyOverrides(tokens: TokenInfo[], chainId: number): TokenInfo[] {
    return tokens.map(token => {
        const override = TOKEN_INFO_OVERRIDES[token.address];
        return override ? { ...token, ...override, address: token.address, chainId } : token;
    });
}

function buildOverrideTokens(addresses: string[], chainId: number): TokenInfo[] {
    return addresses
        .filter(address => address in TOKEN_INFO_OVERRIDES)
        .map(address => ({ address, chainId, ...TOKEN_INFO_OVERRIDES[address] } as TokenInfo));
}

export async function getTokenInfos(
    addresses: string[],
    cluster: Cluster,
    genesisHash?: string,
    config?: FetchConfig
): Promise<TokenInfo[]> {
    if (addresses.length === 0) return [];

    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return [];

    try {
        const response = await fetch(`${UTL_API_BASE_URL}/v1/mints?chainId=${chainId}`, {
            body: JSON.stringify({ addresses }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            next: config?.next,
            signal: config?.signal,
        });

        // checks for 200-299 range
        if (!response.ok) {
            config?.onError?.(new TokenInfoHttpError({ status: response.status, statusText: response.statusText }));
            return buildOverrideTokens(addresses, chainId);
        }

        const data = (await response.json()) as { content?: TokenInfo[] };

        if (!data.content) {
            config?.onError?.(new TokenInfoInvalidResponseError());
            return buildOverrideTokens(addresses, chainId);
        }

        const merged = applyOverrides(data.content, chainId);
        const returnedAddresses = new Set(merged.map(t => t.address));
        const missingOverrides = buildOverrideTokens(
            addresses.filter(a => !returnedAddresses.has(a)),
            chainId
        );
        return [...merged, ...missingOverrides];
    } catch (error) {
        config?.onError?.(error);
        return buildOverrideTokens(addresses, chainId);
    }
}

export async function getTokenInfo(
    address: string,
    cluster: Cluster,
    genesisHash?: string,
    config?: FetchConfig
): Promise<TokenInfo | undefined> {
    const tokens = await getTokenInfos([address], cluster, genesisHash, config);
    return tokens[0];
}
