import { Address } from '@components/common/Address';
import { PublicKey, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { decodeTokenMessage, decodeWarpInstruction } from './decoder';
import {
    assetSymbol,
    formatTokenAmount,
    getAssetLinkAddress,
    getHyperlaneDomainName,
    getHyperlaneWarpRoute,
    HyperlaneSide,
    HyperlaneWarpRouteInfo,
} from './types';

type Props = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function HyperlaneWarpDetailsCard({ ix, index, result, innerCards, childIndex }: Props) {
    const programId = ix.programId.toBase58();
    const route = getHyperlaneWarpRoute(programId);
    const decoded = decodeWarpInstruction(ix.data);

    const routeLabel = route ? `${route.label} Warp Route` : 'Hyperlane Warp Route';
    const title = decoded ? `${routeLabel}: ${describeWarpKind(decoded.kind)}` : `${routeLabel}: Unknown`;

    const subtitle = route && decoded ? buildBridgeSubtitle(route, decoded) : undefined;

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
            {route && <RouteRows route={route} programId={programId} />}
            {decoded?.kind === 'TransferRemote' && (
                <>
                    <tr>
                        <td>Destination Domain</td>
                        <td className="text-lg-end">
                            {getHyperlaneDomainName(decoded.destinationDomain)} ({decoded.destinationDomain})
                        </td>
                    </tr>
                    <tr>
                        <td>Recipient</td>
                        <td className="text-lg-end">
                            <Address pubkey={decoded.recipient} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td className="text-lg-end">
                            {formatTokenAmount(decoded.amount, route?.decimals)}
                            {route ? ` ${assetSymbol(route)}` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td>Raw Amount</td>
                        <td className="text-lg-end font-monospace">{decoded.amount.toString()}</td>
                    </tr>
                </>
            )}
            {(decoded?.kind === 'Handle' || decoded?.kind === 'HandleAccountMetas') && (
                <HandleRows
                    origin={decoded.origin}
                    sender={decoded.sender}
                    messageBody={decoded.messageBody}
                    route={route}
                />
            )}
            {decoded?.kind === 'WarpAdmin' && (
                <tr>
                    <td>Variant</td>
                    <td className="text-lg-end font-monospace">{decoded.variant}</td>
                </tr>
            )}
            {decoded?.kind === 'InterchainSecurityModule' && (
                <tr>
                    <td>Interface Call</td>
                    <td className="text-lg-end">Get ISM</td>
                </tr>
            )}
            {decoded?.kind === 'InterchainSecurityModuleAccountMetas' && (
                <tr>
                    <td>Interface Call</td>
                    <td className="text-lg-end">Get ISM Account Metas</td>
                </tr>
            )}
        </InstructionCard>
    );
}

function HandleRows({
    origin,
    sender,
    messageBody,
    route,
}: {
    origin: number;
    sender: import('@solana/web3.js').PublicKey;
    messageBody: Buffer;
    route?: HyperlaneWarpRouteInfo;
}) {
    const tokenMessage = decodeTokenMessage(messageBody);
    return (
        <>
            <tr>
                <td>Origin Domain</td>
                <td className="text-lg-end">
                    {getHyperlaneDomainName(origin)} ({origin})
                </td>
            </tr>
            <tr>
                <td>Sender (remote router)</td>
                <td className="text-lg-end">
                    <Address pubkey={sender} alignRight link />
                </td>
            </tr>
            {tokenMessage ? (
                <>
                    <tr>
                        <td>Recipient (final)</td>
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
                    {tokenMessage.metadata.length > 0 && (
                        <tr>
                            <td>Token Metadata</td>
                            <td className="text-lg-end font-monospace">
                                {tokenMessage.metadata.length} bytes — 0x{truncateHex(tokenMessage.metadata, 20)}
                            </td>
                        </tr>
                    )}
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

function RouteRows({ route, programId }: { route: HyperlaneWarpRouteInfo; programId: string }) {
    return (
        <>
            <tr>
                <td>Asset</td>
                <td className="text-lg-end">
                    <Address
                        pubkey={new PublicKey(getAssetLinkAddress(route, programId))}
                        alignRight
                        link
                        overrideText={route.label}
                    />
                </td>
            </tr>
            <tr>
                <td>Mode</td>
                <td className="text-lg-end">{capitalize(route.mode)}</td>
            </tr>
            <tr>
                <td>Side</td>
                <td className="text-lg-end">{capitalize(route.side)}</td>
            </tr>
        </>
    );
}

function buildBridgeSubtitle(
    route: HyperlaneWarpRouteInfo,
    decoded: ReturnType<typeof decodeWarpInstruction>
): React.ReactNode | undefined {
    if (!decoded) return undefined;

    if (decoded.kind === 'TransferRemote') {
        // Outbound: user calls warp route directly to bridge OUT.
        // Source = the route's local side (where this program lives).
        // Destination = decoded.destinationDomain.
        return renderBridgeSubtitle({
            asset: assetSymbol(route),
            destinationLabel: getHyperlaneDomainName(decoded.destinationDomain),
            rawAmount: decoded.amount,
            sourceLabel: chainLabelFromSide(route.side),
            tokenDecimals: route.decimals,
        });
    }

    if (decoded.kind === 'Handle' || decoded.kind === 'HandleAccountMetas') {
        // Inbound: mailbox CPIs into the local warp route to release/mint.
        // Source = decoded.origin domain. Destination = local route side.
        // Amount lives in the embedded TokenMessage body.
        const tokenMessage = decodeTokenMessage(decoded.messageBody);
        return renderBridgeSubtitle({
            asset: assetSymbol(route),
            destinationLabel: chainLabelFromSide(route.side),
            rawAmount: tokenMessage?.amount,
            sourceLabel: getHyperlaneDomainName(decoded.origin),
            tokenDecimals: route.decimals,
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

function chainLabelFromSide(side: HyperlaneSide): string {
    return side === 'nara' ? 'Nara' : 'Solana';
}

function describeWarpKind(kind: string): string {
    switch (kind) {
        case 'TransferRemote':
            return 'Transfer Remote (Bridge Out)';
        case 'Handle':
            return 'Handle (Bridge In)';
        case 'HandleAccountMetas':
            return 'Handle Account Metas';
        case 'InterchainSecurityModule':
            return 'Get ISM';
        case 'InterchainSecurityModuleAccountMetas':
            return 'Get ISM Account Metas';
        case 'WarpAdmin':
            return 'Admin';
        default:
            return kind;
    }
}

function truncateHex(buf: Buffer, maxBytes: number): string {
    const slice = buf.length > maxBytes ? buf.subarray(0, maxBytes) : buf;
    const hex = slice.toString('hex');
    return buf.length > maxBytes ? `${hex}…` : hex;
}

function capitalize(s: string): string {
    return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
