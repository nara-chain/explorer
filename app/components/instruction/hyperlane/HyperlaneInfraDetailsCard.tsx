import { Address } from '@components/common/Address';
import { PublicKey, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import {
    DecodedIgp,
    DecodedMultisigIsm,
    DecodedValidatorAnnounce,
    decodeHyperlaneMessage,
    decodeIgpInstruction,
    decodeMultisigIsmInstruction,
    decodeTokenMessage,
    decodeValidatorAnnounceInstruction,
} from './decoder';
import {
    assetSymbol,
    formatTokenAmount,
    getAssetLinkAddress,
    getHyperlaneDomainName,
    getHyperlaneInfra,
    getHyperlaneWarpRoute,
    HyperlaneInfraInfo,
} from './types';

type Props = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function HyperlaneInfraDetailsCard({ ix, index, result, innerCards, childIndex }: Props) {
    const programId = ix.programId.toBase58();
    const info = getHyperlaneInfra(programId);
    if (!info) return null;

    if (info.kind === 'multisig-ism') {
        const decoded = decodeMultisigIsmInstruction(ix.data);
        return (
            <InstructionCard
                ix={ix}
                index={index}
                result={result}
                title={`${info.label}: ${describeIsmKind(decoded?.kind)}`}
                innerCards={innerCards}
                childIndex={childIndex}
                defaultRaw={!decoded}
            >
                <ProgramRow ix={ix} info={info} />
                {decoded && <IsmRows decoded={decoded} />}
            </InstructionCard>
        );
    }

    if (info.kind === 'validator-announce') {
        const decoded = decodeValidatorAnnounceInstruction(ix.data);
        return (
            <InstructionCard
                ix={ix}
                index={index}
                result={result}
                title={`${info.label}: ${decoded?.kind ?? 'Unknown'}`}
                innerCards={innerCards}
                childIndex={childIndex}
                defaultRaw={!decoded}
            >
                <ProgramRow ix={ix} info={info} />
                {decoded && <ValidatorAnnounceRows decoded={decoded} />}
            </InstructionCard>
        );
    }

    if (info.kind === 'igp') {
        const decoded = decodeIgpInstruction(ix.data);
        return (
            <InstructionCard
                ix={ix}
                index={index}
                result={result}
                title={`${info.label}: ${decoded?.kind ?? 'Unknown'}`}
                innerCards={innerCards}
                childIndex={childIndex}
                defaultRaw={!decoded}
            >
                <ProgramRow ix={ix} info={info} />
                {decoded && <IgpRows decoded={decoded} />}
            </InstructionCard>
        );
    }

    return null;
}

function ProgramRow({ ix, info }: { ix: TransactionInstruction; info: HyperlaneInfraInfo }) {
    return (
        <>
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Side</td>
                <td className="text-lg-end">{info.side === 'nara' ? 'Nara' : 'Solana'}</td>
            </tr>
        </>
    );
}

function IsmRows({ decoded }: { decoded: DecodedMultisigIsm }) {
    if (decoded.kind === 'IsmType') {
        return (
            <tr>
                <td>Interface Call</td>
                <td className="text-lg-end">Get ISM Type</td>
            </tr>
        );
    }
    if (decoded.kind === 'IsmVerify' || decoded.kind === 'IsmVerifyAccountMetas') {
        const message = decodeHyperlaneMessage(decoded.message);
        const route = message ? getHyperlaneWarpRoute(message.recipient.toBase58()) : undefined;
        const tokenMessage = message ? decodeTokenMessage(message.body) : undefined;
        return (
            <>
                <tr>
                    <td>ISM Metadata</td>
                    <td className="text-lg-end font-monospace">
                        {decoded.metadata.length} bytes — 0x{truncateHex(decoded.metadata, 20)}
                    </td>
                </tr>
                {message ? (
                    <>
                        <tr>
                            <td>Message Nonce</td>
                            <td className="text-lg-end font-monospace">{message.nonce}</td>
                        </tr>
                        <tr>
                            <td>Origin Domain</td>
                            <td className="text-lg-end">
                                {getHyperlaneDomainName(message.originDomain)} ({message.originDomain})
                            </td>
                        </tr>
                        <tr>
                            <td>Sender (remote router)</td>
                            <td className="text-lg-end">
                                <Address pubkey={message.sender} alignRight link />
                            </td>
                        </tr>
                        <tr>
                            <td>Recipient (warp route)</td>
                            <td className="text-lg-end">
                                <Address pubkey={message.recipient} alignRight link />
                            </td>
                        </tr>
                        {route && message && (
                            <tr>
                                <td>Asset</td>
                                <td className="text-lg-end">
                                    <Address
                                        pubkey={
                                            new PublicKey(getAssetLinkAddress(route, message.recipient.toBase58()))
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
                                    {message.body.length} bytes — 0x{truncateHex(message.body, 20)}
                                </td>
                            </tr>
                        )}
                    </>
                ) : (
                    <tr>
                        <td>Message</td>
                        <td className="text-lg-end font-monospace">
                            {decoded.message.length} bytes — 0x{truncateHex(decoded.message, 20)}
                        </td>
                    </tr>
                )}
            </>
        );
    }
    if (decoded.kind === 'SetValidatorsAndThreshold') {
        return (
            <>
                <tr>
                    <td>Domain</td>
                    <td className="text-lg-end">
                        {getHyperlaneDomainName(decoded.domain)} ({decoded.domain})
                    </td>
                </tr>
                <tr>
                    <td>Threshold</td>
                    <td className="text-lg-end font-monospace">
                        {decoded.threshold} of {decoded.validators.length}
                    </td>
                </tr>
                <tr>
                    <td>Validators (EVM)</td>
                    <td className="text-lg-end font-monospace">
                        <div className="d-flex flex-column align-items-end">
                            {decoded.validators.map(v => (
                                <span key={v}>{v}</span>
                            ))}
                        </div>
                    </td>
                </tr>
            </>
        );
    }
    return (
        <tr>
            <td>Variant</td>
            <td className="text-lg-end font-monospace">{decoded.kind}</td>
        </tr>
    );
}

function ValidatorAnnounceRows({ decoded }: { decoded: DecodedValidatorAnnounce }) {
    if (decoded.kind === 'Init') {
        return (
            <>
                <tr>
                    <td>Mailbox</td>
                    <td className="text-lg-end">
                        <Address pubkey={decoded.mailbox} alignRight link />
                    </td>
                </tr>
                <tr>
                    <td>Local Domain</td>
                    <td className="text-lg-end">
                        {getHyperlaneDomainName(decoded.localDomain)} ({decoded.localDomain})
                    </td>
                </tr>
            </>
        );
    }
    return (
        <>
            <tr>
                <td>Validator (EVM)</td>
                <td className="text-lg-end font-monospace">{decoded.validator}</td>
            </tr>
            <tr>
                <td>Storage Location</td>
                <td className="text-lg-end font-monospace">{decoded.storageLocation}</td>
            </tr>
        </>
    );
}

function IgpRows({ decoded }: { decoded: DecodedIgp }) {
    if (decoded.kind === 'PayForGas') {
        return (
            <>
                <tr>
                    <td>Message ID</td>
                    <td className="text-lg-end font-monospace">{decoded.messageId}</td>
                </tr>
                <tr>
                    <td>Destination Domain</td>
                    <td className="text-lg-end">
                        {getHyperlaneDomainName(decoded.destinationDomain)} ({decoded.destinationDomain})
                    </td>
                </tr>
                <tr>
                    <td>Gas Amount</td>
                    <td className="text-lg-end font-monospace">{decoded.gasAmount.toString()}</td>
                </tr>
            </>
        );
    }
    if (decoded.kind === 'QuoteGasPayment') {
        return (
            <>
                <tr>
                    <td>Destination Domain</td>
                    <td className="text-lg-end">
                        {getHyperlaneDomainName(decoded.destinationDomain)} ({decoded.destinationDomain})
                    </td>
                </tr>
                <tr>
                    <td>Gas Amount</td>
                    <td className="text-lg-end font-monospace">{decoded.gasAmount.toString()}</td>
                </tr>
            </>
        );
    }
    return (
        <tr>
            <td>Variant</td>
            <td className="text-lg-end font-monospace">{decoded.kind}</td>
        </tr>
    );
}

function describeIsmKind(kind?: string): string {
    switch (kind) {
        case 'IsmType':
            return 'Get Type';
        case 'IsmVerify':
            return 'Verify';
        case 'IsmVerifyAccountMetas':
            return 'Verify Account Metas';
        case 'SetValidatorsAndThreshold':
            return 'Set Validators And Threshold';
        case 'Initialize':
            return 'Initialize';
        case 'GetOwner':
            return 'Get Owner';
        case 'TransferOwnership':
            return 'Transfer Ownership';
        default:
            return 'Unknown';
    }
}

function truncateHex(buf: Buffer, maxBytes: number): string {
    const slice = buf.length > maxBytes ? buf.subarray(0, maxBytes) : buf;
    const hex = slice.toString('hex');
    return buf.length > maxBytes ? `${hex}…` : hex;
}
