export enum ClusterStatus {
    Connected,
    Connecting,
    Failure,
}

export enum Cluster {
    MainnetBeta,
    Testnet,
    Devnet,
    Simd296,
    Custom,
}

export const CLUSTERS = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Custom];

export function clusterSlug(cluster: Cluster): string {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return 'mainnet-beta';
        case Cluster.Testnet:
            return 'testnet';
        case Cluster.Devnet:
            return 'devnet';
        case Cluster.Simd296:
            return 'simd296';
        case Cluster.Custom:
            return 'custom';
    }
}

export function clusterName(cluster: Cluster): string {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return 'Mainnet';
        case Cluster.Testnet:
            return 'Testnet';
        case Cluster.Devnet:
            return 'Devnet';
        case Cluster.Simd296:
            return 'SIMD-296';
        case Cluster.Custom:
            return 'Custom';
    }
}

export const MAINNET_BETA_URL = 'https://mainnet-api.nara.build';
export const TESTNET_URL = 'https://testnet-api.nara.build';
export const DEVNET_URL = 'https://devnet-api.nara.build';
export const SIMD296_URL = 'https://simd-0296.surfnet.dev:8899';

// On localhost we use the default RPCs unless custom ones (server + client)
// are specified via env vars. For hosts that use the old api.* pattern we keep
// the explorer-api rewrite in deployed environments.
//
// Custom RPC endpoints are configured via env vars in two tiers:
//   NEXT_PUBLIC_*_RPC_URL — exposed to the browser (clusterUrl).
//   *_RPC_URL             — server-only, used by SSR / API routes (serverClusterUrl).
//
// For production/preview deploys only the server-side var (*_RPC_URL) matters:
// the public one is auto-derived from the default constants + modifyUrl,
// so there is no need to set it.
// For custom RPCs that differ from the defaults you must set both:
// NEXT_PUBLIC_*_RPC_URL (client) and *_RPC_URL (server).
const modifyUrl = (url: string): string => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return url;
    }

    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.startsWith('api.')) {
        parsedUrl.hostname = `explorer-api.${parsedUrl.hostname.slice(4)}`;
    }
    return parsedUrl.toString();
};

export function clusterUrl(cluster: Cluster, customUrl: string): string {
    switch (cluster) {
        case Cluster.Devnet:
            return process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? modifyUrl(DEVNET_URL);
        case Cluster.MainnetBeta:
            return process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? modifyUrl(MAINNET_BETA_URL);
        case Cluster.Testnet:
            return process.env.NEXT_PUBLIC_TESTNET_RPC_URL ?? modifyUrl(TESTNET_URL);
        case Cluster.Simd296:
            return process.env.NEXT_PUBLIC_SIMD296_RPC_URL ?? SIMD296_URL;
        case Cluster.Custom:
            return customUrl;
    }
}

export function serverClusterUrl(cluster: Cluster, customUrl: string): string {
    switch (cluster) {
        case Cluster.Devnet:
            return process.env.DEVNET_RPC_URL ?? modifyUrl(DEVNET_URL);
        case Cluster.MainnetBeta:
            return process.env.MAINNET_RPC_URL ?? modifyUrl(MAINNET_BETA_URL);
        case Cluster.Testnet:
            return process.env.TESTNET_RPC_URL ?? modifyUrl(TESTNET_URL);
        case Cluster.Simd296:
            return process.env.SIMD296_RPC_URL ?? SIMD296_URL;
        case Cluster.Custom:
            return customUrl;
    }
}

export const DEFAULT_CLUSTER = Cluster.MainnetBeta;
