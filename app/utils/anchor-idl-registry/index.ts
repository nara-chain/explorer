import type { Idl } from '@coral-xyz/anchor';

import dammV2Idl from './damm-v2.json';
import dbcIdl from './dbc.json';
import dlmmIdl from './dlmm.json';

/**
 * Static IDL registry for programs whose IDL we want available without an
 * on-chain fetch. Used by `useIdlFromAnchorProgramSeed` as the first lookup
 * before falling back to the `/api/anchor` route or `Program.fetchIdl`.
 *
 * Add an entry here when:
 *   - The program is on Solana mainnet but interesting to surface in the
 *     Nara explorer (cross-chain context, manual transactions, etc.).
 *   - The on-chain IDL is unavailable, stale, or slow to fetch.
 */
export const LOCAL_ANCHOR_IDLS: Record<string, Idl> = {
    LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo: dlmmIdl as Idl,
    cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG: dammV2Idl as Idl,
    dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN: dbcIdl as Idl,
};

export function getLocalAnchorIdl(programAddress: string): Idl | undefined {
    return LOCAL_ANCHOR_IDLS[programAddress];
}
