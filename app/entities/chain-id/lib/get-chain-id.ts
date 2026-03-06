import type { ChainId } from '@solflare-wallet/utl-sdk';
import { Cluster } from '@utils/cluster';

import { GENESIS_HASHES } from './const';

const CHAIN_ID = {
    DEVNET: 103 as ChainId,
    MAINNET: 101 as ChainId,
    TESTNET: 102 as ChainId,
} as const;

function getChainIdFromGenesisHash(genesisHash: string): ChainId | undefined {
    switch (genesisHash) {
        case GENESIS_HASHES.MAINNET:
            return CHAIN_ID.MAINNET;
        case GENESIS_HASHES.DEVNET:
            return CHAIN_ID.DEVNET;
        case GENESIS_HASHES.TESTNET:
            return CHAIN_ID.TESTNET;
        default:
            return undefined;
    }
}

export function getChainId(cluster: Cluster, genesisHash?: string): ChainId | undefined {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return CHAIN_ID.MAINNET;
        case Cluster.Testnet:
            return CHAIN_ID.TESTNET;
        case Cluster.Devnet:
            return CHAIN_ID.DEVNET;
        case Cluster.Simd296:
        case Cluster.Custom:
            return genesisHash ? getChainIdFromGenesisHash(genesisHash) : undefined;
        default:
            return undefined;
    }
}
