'use client';

import { Idl, Program } from '@coral-xyz/anchor';
import { useTokenInfo } from '@entities/token-info';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { TransactionInstruction } from '@solana/web3.js';
import { decodeEventFromLog, instructionIsSelfCPI } from '@utils/anchor';
import bs58 from 'bs58';
import { useMemo } from 'react';

const DLMM_PROGRAM_ID = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo';
const DAMM_V2_PROGRAM_ID = 'cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG';
const DBC_PROGRAM_ID = 'dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN';

// Names below are matched case-insensitively against the Anchor decoder's
// ixName output (which can be camelCase, snake_case, or PascalCase depending
// on the IDL spec / coder version).
const DLMM_SWAP_IX_NAMES = new Set([
    'swap',
    'swap2',
    'swapexactout',
    'swap_exact_out',
    'swapexactout2',
    'swap_exact_out2',
    'swapwithpriceimpact',
    'swap_with_price_impact',
    'swapwithpriceimpact2',
    'swap_with_price_impact2',
]);

const DAMM_V2_SWAP_IX_NAMES = new Set(['swap', 'swap2']);
const DBC_SWAP_IX_NAMES = new Set(['swap']);

type SwapSummary = {
    inputMint: string;
    outputMint: string;
    rawInputAmount: bigint;
    rawOutputAmount: bigint;
};

type Props = {
    ix: TransactionInstruction;
    program: Program<Idl>;
    instructionIndex: number;
    ixName: string;
    signature: string;
};

export function SwapSubtitle({ ix, program, instructionIndex, ixName, signature }: Props) {
    const details = useTransactionDetails(signature);

    const summary = useMemo<SwapSummary | null>(() => {
        const programId = ix.programId.toBase58();
        const tx = details?.data?.transactionWithMeta;
        if (!tx) return null;

        const eventDataPayloads = collectSelfCpiEventPayloads(tx, programId, instructionIndex);
        for (const eventBase64 of eventDataPayloads) {
            const decoded = decodeEventFromLog(eventBase64, program);
            if (!decoded) continue;
            const result = parseSwapEvent(programId, ixName, ix, decoded.name, decoded.data);
            if (result) return result;
        }
        return null;
    }, [details, instructionIndex, program, ix, ixName]);

    if (!summary) return null;

    return (
        <div className="d-flex align-items-center flex-wrap" style={{ gap: '6px' }}>
            <span className="text-muted text-uppercase me-1" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>
                Swap
            </span>
            <Amount mint={summary.inputMint} rawAmount={summary.rawInputAmount} />
            <span className="swap-arrow">→</span>
            <Amount mint={summary.outputMint} rawAmount={summary.rawOutputAmount} />
        </div>
    );
}

function Amount({ mint, rawAmount }: { mint: string; rawAmount: bigint }) {
    const { cluster, clusterInfo } = useCluster();
    const tokenInfo = useTokenInfo(true, mint, cluster, clusterInfo?.genesisHash);
    const decimals = tokenInfo?.decimals ?? undefined;
    const symbol = tokenInfo?.symbol ?? truncateMint(mint);
    return (
        <span>
            <span className="font-monospace">{formatAmount(rawAmount, decimals)}</span>{' '}
            <span style={{ opacity: 0.85 }}>{symbol}</span>
        </span>
    );
}

/**
 * Walks inner instructions for the given top-level instruction index and
 * collects base64-encoded event payloads emitted via Anchor's #[event_cpi]
 * macro. These are inner instructions whose programId equals the program
 * itself and whose data starts with the self-CPI tag.
 *
 * Returns the data with the 8-byte tag already stripped — i.e. ready for
 * `decodeEventFromLog` (which expects discriminator + body).
 */
function collectSelfCpiEventPayloads(tx: any, programId: string, instructionIndex: number): string[] {
    const payloads: string[] = [];
    const innerByIndex = tx?.meta?.innerInstructions ?? [];
    const accountKeys = tx?.transaction?.message?.accountKeys ?? [];

    for (const group of innerByIndex) {
        if (group.index !== instructionIndex) continue;
        for (const inner of group.instructions ?? []) {
            const innerProgramId = resolveProgramId(inner, accountKeys);
            if (innerProgramId !== programId) continue;
            const dataBytes = decodeInstructionData(inner);
            if (!dataBytes) continue;
            // Build a TransactionInstruction-shaped object just for the helper.
            if (!instructionIsSelfCPI(dataBytes)) continue;
            // Strip the 8-byte self-CPI tag; the remainder is the event data
            // (8-byte event discriminator + borsh-encoded fields).
            const eventBytes = dataBytes.subarray(8);
            payloads.push(eventBytes.toString('base64'));
        }
    }
    return payloads;
}

function resolveProgramId(inner: any, accountKeys: any[]): string | undefined {
    // ParsedInstruction shape (jsonParsed): has `programId` directly.
    if (inner.programId) {
        return typeof inner.programId === 'string' ? inner.programId : inner.programId.toBase58?.();
    }
    // Compiled shape (json encoding): has `programIdIndex`.
    if (typeof inner.programIdIndex === 'number') {
        const k = accountKeys[inner.programIdIndex];
        return typeof k === 'string' ? k : k?.pubkey?.toBase58?.() ?? k?.pubkey;
    }
    return undefined;
}

function decodeInstructionData(inner: any): Buffer | null {
    if (typeof inner.data === 'string') {
        try {
            return Buffer.from(bs58.decode(inner.data));
        } catch {
            return null;
        }
    }
    if (inner.data && typeof inner.data === 'object' && Array.isArray(inner.data)) {
        // [base64, "base64"] tuple shape
        try {
            return Buffer.from(inner.data[0], inner.data[1] as BufferEncoding);
        } catch {
            return null;
        }
    }
    return null;
}

function parseSwapEvent(
    programId: string,
    ixName: string,
    ix: TransactionInstruction,
    eventName: string,
    eventData: any
): SwapSummary | null {
    const evtLower = eventName.toLowerCase();
    const ixLower = ixName.toLowerCase();
    if (programId === DLMM_PROGRAM_ID && DLMM_SWAP_IX_NAMES.has(ixLower)) {
        if (evtLower !== 'swap') return null;
        const amountIn = readBigInt(eventData, 'amountIn', 'amount_in');
        const amountOut = readBigInt(eventData, 'amountOut', 'amount_out');
        const swapForY = readBool(eventData, 'swapForY', 'swap_for_y');
        if (amountIn === null || amountOut === null || swapForY === null) return null;
        const tokenXMint = ix.keys[6]?.pubkey?.toBase58();
        const tokenYMint = ix.keys[7]?.pubkey?.toBase58();
        if (!tokenXMint || !tokenYMint) return null;
        return {
            inputMint: swapForY ? tokenXMint : tokenYMint,
            outputMint: swapForY ? tokenYMint : tokenXMint,
            rawInputAmount: amountIn,
            rawOutputAmount: amountOut,
        };
    }

    if (programId === DAMM_V2_PROGRAM_ID && DAMM_V2_SWAP_IX_NAMES.has(ixLower)) {
        if (evtLower !== 'evtswap2') return null;
        const amountIn = readBigInt(
            eventData,
            'includedTransferFeeAmountIn',
            'included_transfer_fee_amount_in'
        );
        const amountOut = readBigInt(
            eventData,
            'includedTransferFeeAmountOut',
            'included_transfer_fee_amount_out'
        );
        const direction = readNumber(eventData, 'tradeDirection', 'trade_direction');
        if (amountIn === null || amountOut === null || direction === null) return null;
        const tokenAMint = ix.keys[6]?.pubkey?.toBase58();
        const tokenBMint = ix.keys[7]?.pubkey?.toBase58();
        if (!tokenAMint || !tokenBMint) return null;
        // trade_direction: 0 = A→B, 1 = B→A
        return {
            inputMint: direction === 0 ? tokenAMint : tokenBMint,
            outputMint: direction === 0 ? tokenBMint : tokenAMint,
            rawInputAmount: amountIn,
            rawOutputAmount: amountOut,
        };
    }

    if (programId === DBC_PROGRAM_ID && DBC_SWAP_IX_NAMES.has(ixLower)) {
        if (evtLower !== 'evtswap') return null;
        const swapResult = (eventData?.swapResult ?? eventData?.swap_result) ?? {};
        const amountIn =
            readBigInt(swapResult, 'actualInputAmount', 'actual_input_amount') ??
            readBigInt(eventData, 'amountIn', 'amount_in');
        const amountOut = readBigInt(swapResult, 'outputAmount', 'output_amount');
        const direction = readNumber(eventData, 'tradeDirection', 'trade_direction');
        if (amountIn === null || amountOut === null || direction === null) return null;
        const baseMint = ix.keys[7]?.pubkey?.toBase58();
        const quoteMint = ix.keys[8]?.pubkey?.toBase58();
        if (!baseMint || !quoteMint) return null;
        // trade_direction: 0 = base→quote, 1 = quote→base
        return {
            inputMint: direction === 0 ? baseMint : quoteMint,
            outputMint: direction === 0 ? quoteMint : baseMint,
            rawInputAmount: amountIn,
            rawOutputAmount: amountOut,
        };
    }

    return null;
}

function readBigInt(data: any, ...keys: string[]): bigint | null {
    for (const k of keys) {
        const v = data?.[k];
        if (v === undefined || v === null) continue;
        try {
            if (typeof v === 'bigint') return v;
            if (typeof v === 'number') return BigInt(v);
            if (typeof v === 'string') return BigInt(v);
            if (typeof v?.toString === 'function') return BigInt(v.toString());
        } catch {
            continue;
        }
    }
    return null;
}

function readNumber(data: any, ...keys: string[]): number | null {
    for (const k of keys) {
        const v = data?.[k];
        if (v === undefined || v === null) continue;
        if (typeof v === 'number') return v;
        if (typeof v === 'bigint') return Number(v);
        if (typeof v === 'string') {
            const n = Number(v);
            if (!Number.isNaN(n)) return n;
        }
    }
    return null;
}

function readBool(data: any, ...keys: string[]): boolean | null {
    for (const k of keys) {
        const v = data?.[k];
        if (v === undefined || v === null) continue;
        if (typeof v === 'boolean') return v;
    }
    return null;
}

function formatAmount(raw: bigint, decimals?: number): string {
    if (decimals === undefined) return raw.toString();
    const base = 10n ** BigInt(decimals);
    const whole = raw / base;
    const frac = raw % base;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(decimals, '0');
    let end = fracStr.length;
    while (end > 0 && fracStr[end - 1] === '0') end--;
    // Cap displayed precision to 6 fractional digits to keep the subtitle compact
    const displayed = fracStr.slice(0, Math.min(end, 6));
    return displayed.length > 0 ? `${whole.toString()}.${displayed}` : whole.toString();
}

function truncateMint(mint: string): string {
    return mint.length > 8 ? `${mint.slice(0, 4)}…${mint.slice(-4)}` : mint;
}
