import { Address } from '@components/common/Address';
import { PublicKey, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { decodeHyperlaneMessage, decodeMailboxInstruction, decodeTokenMessage } from './decoder';
import {
    assetSymbol,
    formatTokenAmount,
    getAssetLinkAddress,
    getHyperlaneDomainName,
    getHyperlaneMailbox,
    getHyperlaneWarpRoute,
    HyperlaneMailboxInfo,
    HyperlaneSide,
    HyperlaneWarpRouteInfo,
} from './types';

function AssetRow({ route, programId }: { route: HyperlaneWarpRouteInfo; programId: string }) {
    return (
        <tr>
            <td>Asset</td>
            <td className="text-lg-end">
                <Address pubkey={new PublicKey(getAssetLinkAddress(route, programId))} alignRight link overrideText={route.label} />
            </td>
        </tr>
    );
}

type Props = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function HyperlaneMailboxDetailsCard({ ix, index, result, innerCards, childIndex }: Props) {
    const programId = ix.programId.toBase58();
    const mailbox = getHyperlaneMailbox(programId);
    const decoded = decodeMailboxInstruction(ix.data);

    const mailboxLabel = mailbox?.label ?? 'Hyperlane Mailbox';
    const title = decoded ? `${mailboxLabel}: ${describeMailboxKind(decoded.kind)}` : `${mailboxLabel}: Unknown`;

    const subtitle = mailbox && decoded ? buildBridgeSubtitle(mailbox, decoded) : undefined;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={title}
            subtitle={subtitle}
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
            {decoded?.kind === 'OutboxDispatch' && (
                <OutboxDispatchRows
                    sender={decoded.sender}
                    destinationDomain={decoded.destinationDomain}
                    recipient={decoded.recipient}
                    messageBody={decoded.messageBody}
                />
            )}
            {decoded?.kind === 'InboxProcess' && (
                <InboxProcessRows metadata={decoded.metadata} message={decoded.message} />
            )}
        </InstructionCard>
    );
}

function InboxProcessRows({ metadata, message }: { metadata: Buffer; message: Buffer }) {
    const decoded = decodeHyperlaneMessage(message);
    const route = decoded ? getHyperlaneWarpRoute(decoded.recipient.toBase58()) : undefined;
    const tokenMessage = decoded ? decodeTokenMessage(decoded.body) : undefined;
    return (
        <>
            <tr>
                <td>ISM Metadata</td>
                <td className="text-lg-end font-monospace">
                    {metadata.length} bytes — 0x{truncateHex(metadata, 20)}
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
                        <td>Sender (remote)</td>
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
                        <td>Recipient (warp route)</td>
                        <td className="text-lg-end">
                            <Address pubkey={decoded.recipient} alignRight link />
                        </td>
                    </tr>
                    {route && <AssetRow route={route} programId={decoded.recipient.toBase58()} />}
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
                                {decoded.body.length} bytes — 0x{truncateHex(decoded.body, 20)}
                            </td>
                        </tr>
                    )}
                </>
            ) : (
                <tr>
                    <td>Encoded Message</td>
                    <td className="text-lg-end font-monospace">
                        {message.length} bytes — 0x{truncateHex(message, 20)}
                    </td>
                </tr>
            )}
        </>
    );
}

function OutboxDispatchRows({
    sender,
    destinationDomain,
    recipient,
    messageBody,
}: {
    sender: PublicKey;
    destinationDomain: number;
    recipient: PublicKey;
    messageBody: Buffer;
}) {
    // The CPI caller (warp route) is the local sender. Look it up to format amount with decimals.
    const route = getHyperlaneWarpRoute(sender.toBase58());
    const tokenMessage = decodeTokenMessage(messageBody);
    return (
        <>
            <tr>
                <td>Sender (warp route)</td>
                <td className="text-lg-end">
                    <Address pubkey={sender} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Destination Domain</td>
                <td className="text-lg-end">
                    {getHyperlaneDomainName(destinationDomain)} ({destinationDomain})
                </td>
            </tr>
            <tr>
                <td>Recipient (remote router)</td>
                <td className="text-lg-end">
                    <Address pubkey={recipient} alignRight link />
                </td>
            </tr>
            {route && <AssetRow route={route} programId={sender.toBase58()} />}
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
                        <td className="text-lg-end font-monospace">{tokenMessage.amount.toString()}</td>
                    </tr>
                </>
            ) : (
                <tr>
                    <td>Message Body</td>
                    <td className="text-lg-end font-monospace">
                        {messageBody.length} bytes — 0x{truncateHex(messageBody, 20)}
                    </td>
                </tr>
            )}
        </>
    );
}

function buildBridgeSubtitle(
    mailbox: HyperlaneMailboxInfo,
    decoded: ReturnType<typeof decodeMailboxInstruction>
): React.ReactNode | undefined {
    if (!decoded) return undefined;

    if (decoded.kind === 'OutboxDispatch') {
        // Outbound: local mailbox sends a message to remote chain.
        // The CPI caller (sender) is the local warp route, which tells us the asset.
        const route = getHyperlaneWarpRoute(decoded.sender.toBase58());
        const tokenMessage = decodeTokenMessage(decoded.messageBody);
        return renderBridgeSubtitle({
            asset: route ? assetSymbol(route) : undefined,
            destinationLabel: chainLabel(decoded.destinationDomain),
            rawAmount: tokenMessage?.amount,
            sourceLabel: chainLabelFromSide(mailbox.side),
            tokenDecimals: route?.decimals,
        });
    }

    if (decoded.kind === 'InboxProcess') {
        // Inbound: local mailbox processes a message from remote chain.
        // Decode the wrapped HyperlaneMessage header for origin/destination/recipient,
        // then look up the local recipient warp route for the asset.
        const message = decodeHyperlaneMessage(decoded.message);
        if (!message) return undefined;
        const route = getHyperlaneWarpRoute(message.recipient.toBase58());
        const tokenMessage = decodeTokenMessage(message.body);
        return renderBridgeSubtitle({
            asset: route ? assetSymbol(route) : undefined,
            destinationLabel: chainLabelFromSide(mailbox.side),
            rawAmount: tokenMessage?.amount,
            sourceLabel: chainLabel(message.originDomain),
            tokenDecimals: route?.decimals,
        });
    }

    return undefined;
}

function renderBridgeSubtitle({
    sourceLabel,
    destinationLabel,
    rawAmount,
    tokenDecimals,
    asset,
}: {
    sourceLabel: string;
    destinationLabel: string;
    rawAmount?: bigint;
    tokenDecimals?: number;
    asset?: string;
}): React.ReactNode {
    return (
        <div className="d-flex align-items-center flex-wrap" style={{ gap: '6px' }}>
            <span className="text-muted text-uppercase me-1" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>
                Bridge
            </span>
            {rawAmount !== undefined && (
                <>
                    <span className="font-monospace">{formatTokenAmount(rawAmount, tokenDecimals)}</span>
                    {asset && <span style={{ opacity: 0.85 }}>{asset}</span>}
                    <span className="swap-arrow">·</span>
                </>
            )}
            <span>{sourceLabel}</span>
            <span className="swap-arrow">→</span>
            <span>{destinationLabel}</span>
        </div>
    );
}

function chainLabel(domain: number): string {
    return getHyperlaneDomainName(domain);
}

function chainLabelFromSide(side: HyperlaneSide): string {
    return side === 'nara' ? 'Nara' : 'Solana';
}

function describeMailboxKind(kind: string): string {
    switch (kind) {
        case 'OutboxDispatch':
            return 'Outbox Dispatch';
        case 'InboxProcess':
            return 'Inbox Process';
        case 'InboxSetDefaultIsm':
            return 'Set Default ISM';
        case 'InboxGetRecipientIsm':
            return 'Get Recipient ISM';
        case 'OutboxGetCount':
            return 'Get Outbox Count';
        case 'OutboxGetLatestCheckpoint':
            return 'Get Latest Checkpoint';
        case 'OutboxGetRoot':
            return 'Get Outbox Root';
        case 'GetOwner':
            return 'Get Owner';
        case 'TransferOwnership':
            return 'Transfer Ownership';
        case 'ClaimProtocolFees':
            return 'Claim Protocol Fees';
        case 'SetProtocolFeeConfig':
            return 'Set Protocol Fee Config';
        case 'UpdateLocalDomain':
            return 'Update Local Domain';
        case 'Init':
            return 'Init';
        default:
            return kind;
    }
}

function truncateHex(buf: Buffer, maxBytes: number): string {
    const slice = buf.length > maxBytes ? buf.subarray(0, maxBytes) : buf;
    const hex = slice.toString('hex');
    return buf.length > maxBytes ? `${hex}…` : hex;
}
