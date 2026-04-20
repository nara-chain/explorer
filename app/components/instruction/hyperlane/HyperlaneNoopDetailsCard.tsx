import { Address } from '@components/common/Address';
import { PublicKey, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { decodeHyperlaneMessage, decodeTokenMessage } from './decoder';
import {
    assetSymbol,
    formatTokenAmount,
    getAssetLinkAddress,
    getHyperlaneDomainName,
    getHyperlaneWarpRoute,
} from './types';

type Props = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

/**
 * SPL Noop is used by Hyperlane mailbox to emit dispatched messages as
 * "events" that off-chain relayers can index. The instruction data is the
 * full Hyperlane message bytes. If decoding fails (e.g. when noop is used
 * by an unrelated program like SPL Account Compression), we fall back to
 * raw display.
 */
export function HyperlaneNoopDetailsCard({ ix, index, result, innerCards, childIndex }: Props) {
    const decoded = decodeHyperlaneMessage(ix.data);
    // The recipient field of the message is the warp route on the destination chain;
    // for the dispatched-message noop emitted on the SOURCE chain, the SENDER is the
    // local warp route. Try sender first, then recipient.
    const route = decoded
        ? getHyperlaneWarpRoute(decoded.sender.toBase58()) ?? getHyperlaneWarpRoute(decoded.recipient.toBase58())
        : undefined;
    const tokenMessage = decoded ? decodeTokenMessage(decoded.body) : undefined;
    const title = decoded ? 'SPL Noop: Hyperlane Dispatched Message' : 'SPL Noop';

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={title}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw={!decoded}
        >
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>
            {decoded ? (
                <>
                    <tr>
                        <td>Message Version</td>
                        <td className="text-lg-end font-monospace">{decoded.version}</td>
                    </tr>
                    <tr>
                        <td>Message Nonce</td>
                        <td className="text-lg-end font-monospace">{decoded.nonce}</td>
                    </tr>
                    <tr>
                        <td>Origin Domain</td>
                        <td className="text-lg-end">
                            {getHyperlaneDomainName(decoded.originDomain)} ({decoded.originDomain})
                        </td>
                    </tr>
                    <tr>
                        <td>Sender (warp route)</td>
                        <td className="text-lg-end">
                            <Address pubkey={decoded.sender} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Destination Domain</td>
                        <td className="text-lg-end">
                            {getHyperlaneDomainName(decoded.destinationDomain)} ({decoded.destinationDomain})
                        </td>
                    </tr>
                    <tr>
                        <td>Recipient (remote router)</td>
                        <td className="text-lg-end">
                            <Address pubkey={decoded.recipient} alignRight link />
                        </td>
                    </tr>
                    {route && (
                        <tr>
                            <td>Asset</td>
                            <td className="text-lg-end">
                                <Address
                                    pubkey={
                                        new PublicKey(
                                            getAssetLinkAddress(
                                                route,
                                                getHyperlaneWarpRoute(decoded.sender.toBase58())
                                                    ? decoded.sender.toBase58()
                                                    : decoded.recipient.toBase58()
                                            )
                                        )
                                    }
                                    alignRight
                                    link
                                    overrideText={route.label}
                                />
                            </td>
                        </tr>
                    )}
                    {tokenMessage ? (
                        <>
                            <tr>
                                <td>Token Recipient</td>
                                <td className="text-lg-end">
                                    <Address pubkey={tokenMessage.recipient} alignRight link />
                                </td>
                            </tr>
                            <tr>
                                <td>Amount</td>
                                <td className="text-lg-end">
                                    {formatTokenAmount(tokenMessage.amount, route?.decimals)}
                                    {route ? ` ${assetSymbol(route)}` : ''}
                                </td>
                            </tr>
                            <tr>
                                <td>Raw Amount</td>
                                <td className="text-lg-end font-monospace">
                                    {tokenMessage.amount.toString()}
                                </td>
                            </tr>
                        </>
                    ) : (
                        <tr>
                            <td>Body</td>
                            <td className="text-lg-end font-monospace">
                                {decoded.body.length} bytes — 0x{truncateHex(decoded.body, 24)}
                            </td>
                        </tr>
                    )}
                </>
            ) : null}
        </InstructionCard>
    );
}

function truncateHex(buf: Buffer, maxBytes: number): string {
    const slice = buf.length > maxBytes ? buf.subarray(0, maxBytes) : buf;
    const hex = slice.toString('hex');
    return buf.length > maxBytes ? `${hex}…` : hex;
}
