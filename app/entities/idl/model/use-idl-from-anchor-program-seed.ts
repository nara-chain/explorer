'use client';

import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

import { getLocalAnchorIdl } from '@/app/utils/anchor-idl-registry';
import { Cluster } from '@/app/utils/cluster';

const cachedAnchorProgramPromises: Record<
    string,
    void | { __type: 'promise'; promise: Promise<void> } | { __type: 'result'; result: Idl | null }
> = {};

export function getProvider(url: string) {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}

export function useIdlFromAnchorProgramSeed(programAddress: string, url: string, cluster?: Cluster): Idl | null {
    // Static registry takes precedence: avoids a network round trip and works
    // even when the on-chain IDL is unavailable (e.g. Meteora programs viewed
    // from the Nara cluster).
    const localIdl = getLocalAnchorIdl(programAddress);
    if (localIdl) return localIdl;

    const key = `${programAddress}-${url}`;
    const cacheEntry = cachedAnchorProgramPromises[key];

    if (cacheEntry === undefined) {
        let promise;
        cluster = cluster || Cluster.MainnetBeta;
        if (cluster !== undefined && cluster !== Cluster.Custom) {
            promise = fetch(`/api/anchor?programAddress=${programAddress}&cluster=${cluster}`)
                .then(async result => {
                    return result
                        .json()
                        .then(({ idl, error }) => {
                            if (!idl) {
                                throw new Error(error || `IDL not found for program: ${programAddress.toString()}`);
                            }
                            cachedAnchorProgramPromises[key] = {
                                __type: 'result',
                                result: idl,
                            };
                        })
                        .catch(_ => {
                            cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
                        });
                })
                .catch(_ => {
                    cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
                });
        } else {
            const programId = new PublicKey(programAddress);
            promise = Program.fetchIdl<Idl>(programId, getProvider(url))
                .then(idl => {
                    if (!idl) {
                        throw new Error(`IDL not found for program: ${programAddress.toString()}`);
                    }

                    cachedAnchorProgramPromises[key] = {
                        __type: 'result',
                        result: idl,
                    };
                })
                .catch(_ => {
                    cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
                });
            cachedAnchorProgramPromises[key] = {
                __type: 'promise',
                promise,
            };
        }
        throw promise;
    } else if (cacheEntry.__type === 'promise') {
        throw cacheEntry.promise;
    }
    return cacheEntry.result;
}
