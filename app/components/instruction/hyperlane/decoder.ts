import { PublicKey } from '@solana/web3.js';

/**
 * Decoder for Hyperlane Sealevel instructions.
 *
 * Two discriminator schemes coexist:
 *   - Warp route owner/admin instructions: 8 bytes `[1; 8]` then 1-byte borsh enum tag.
 *   - Message recipient interface (Handle/ISM): 8 bytes hash-derived discriminator.
 *   - Mailbox: borsh enum directly (1-byte tag).
 */

export const WARP_DISCRIMINATOR = Buffer.from([1, 1, 1, 1, 1, 1, 1, 1]);
export const HANDLE_DISCRIMINATOR = Buffer.from([33, 210, 5, 66, 196, 212, 239, 142]);
export const HANDLE_ACCOUNT_METAS_DISCRIMINATOR = Buffer.from([194, 141, 30, 82, 241, 41, 169, 52]);
export const ISM_DISCRIMINATOR = Buffer.from([45, 18, 245, 87, 234, 46, 246, 15]);
export const ISM_ACCOUNT_METAS_DISCRIMINATOR = Buffer.from([190, 214, 218, 129, 67, 97, 4, 76]);

const startsWith = (data: Buffer | Uint8Array, prefix: Buffer): boolean => {
    if (data.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i++) {
        if (data[i] !== prefix[i]) return false;
    }
    return true;
};

const toBuffer = (data: Buffer | Uint8Array): Buffer =>
    Buffer.isBuffer(data) ? data : Buffer.from(data);

export type WarpInstructionVariant =
    | 'Init'
    | 'TransferRemote'
    | 'EnrollRemoteRouter'
    | 'EnrollRemoteRouters'
    | 'SetDestinationGasConfigs'
    | 'SetInterchainSecurityModule'
    | 'SetInterchainGasPaymaster'
    | 'TransferOwnership';

const WARP_VARIANTS: WarpInstructionVariant[] = [
    'Init',
    'TransferRemote',
    'EnrollRemoteRouter',
    'EnrollRemoteRouters',
    'SetDestinationGasConfigs',
    'SetInterchainSecurityModule',
    'SetInterchainGasPaymaster',
    'TransferOwnership',
];

export type DecodedWarpInstruction =
    | { kind: 'TransferRemote'; destinationDomain: number; recipient: PublicKey; amount: bigint }
    | { kind: 'Handle'; origin: number; sender: PublicKey; messageBody: Buffer }
    | { kind: 'HandleAccountMetas'; origin: number; sender: PublicKey; messageBody: Buffer }
    | { kind: 'InterchainSecurityModule' }
    | { kind: 'InterchainSecurityModuleAccountMetas' }
    | { kind: 'WarpAdmin'; variant: WarpInstructionVariant };

export function decodeWarpInstruction(rawData: Buffer | Uint8Array): DecodedWarpInstruction | undefined {
    const data = toBuffer(rawData);

    if (startsWith(data, WARP_DISCRIMINATOR)) {
        if (data.length < 9) return undefined;
        const variantTag = data[8];
        const variant = WARP_VARIANTS[variantTag];
        if (!variant) return undefined;

        if (variant === 'TransferRemote') {
            // [9..13) destination_domain u32 LE
            // [13..45) recipient (32 bytes)
            // [45..77) amount_or_id U256 LE (we read low 8 bytes as u64)
            if (data.length < 77) return undefined;
            const destinationDomain = data.readUInt32LE(9);
            const recipient = new PublicKey(data.subarray(13, 45));
            const amount = data.readBigUInt64LE(45);
            return { amount, destinationDomain, kind: 'TransferRemote', recipient };
        }

        return { kind: 'WarpAdmin', variant };
    }

    if (startsWith(data, HANDLE_DISCRIMINATOR) || startsWith(data, HANDLE_ACCOUNT_METAS_DISCRIMINATOR)) {
        // After 8-byte discriminator: HandleInstruction { origin: u32, sender: H256, message: Vec<u8> }
        if (data.length < 8 + 4 + 32 + 4) return undefined;
        const origin = data.readUInt32LE(8);
        const sender = new PublicKey(data.subarray(12, 44));
        const bodyLen = data.readUInt32LE(44);
        const messageBody = data.subarray(48, 48 + bodyLen);
        return {
            kind: startsWith(data, HANDLE_DISCRIMINATOR) ? 'Handle' : 'HandleAccountMetas',
            messageBody: Buffer.from(messageBody),
            origin,
            sender,
        };
    }

    if (startsWith(data, ISM_DISCRIMINATOR)) {
        return { kind: 'InterchainSecurityModule' };
    }
    if (startsWith(data, ISM_ACCOUNT_METAS_DISCRIMINATOR)) {
        return { kind: 'InterchainSecurityModuleAccountMetas' };
    }

    return undefined;
}

export type MailboxInstructionVariant =
    | 'Init'
    | 'InboxProcess'
    | 'InboxSetDefaultIsm'
    | 'InboxGetRecipientIsm'
    | 'OutboxDispatch'
    | 'OutboxGetCount'
    | 'OutboxGetLatestCheckpoint'
    | 'OutboxGetRoot'
    | 'GetOwner'
    | 'TransferOwnership'
    | 'ClaimProtocolFees'
    | 'SetProtocolFeeConfig'
    | 'UpdateLocalDomain';

const MAILBOX_VARIANTS: MailboxInstructionVariant[] = [
    'Init',
    'InboxProcess',
    'InboxSetDefaultIsm',
    'InboxGetRecipientIsm',
    'OutboxDispatch',
    'OutboxGetCount',
    'OutboxGetLatestCheckpoint',
    'OutboxGetRoot',
    'GetOwner',
    'TransferOwnership',
    'ClaimProtocolFees',
    'SetProtocolFeeConfig',
    'UpdateLocalDomain',
];

type OtherMailboxKind = Exclude<MailboxInstructionVariant, 'InboxProcess' | 'OutboxDispatch'>;

export type DecodedMailboxInstruction =
    | { kind: 'InboxProcess'; metadata: Buffer; message: Buffer }
    | { kind: 'OutboxDispatch'; sender: PublicKey; destinationDomain: number; recipient: PublicKey; messageBody: Buffer }
    | { kind: OtherMailboxKind };

export function decodeMailboxInstruction(rawData: Buffer | Uint8Array): DecodedMailboxInstruction | undefined {
    const data = toBuffer(rawData);
    if (data.length < 1) return undefined;
    const variant = MAILBOX_VARIANTS[data[0]];
    if (!variant) return undefined;

    if (variant === 'InboxProcess') {
        // borsh: { metadata: Vec<u8>, message: Vec<u8> }
        if (data.length < 5) return undefined;
        const metadataLen = data.readUInt32LE(1);
        const metadataStart = 5;
        const metadataEnd = metadataStart + metadataLen;
        if (data.length < metadataEnd + 4) return undefined;
        const messageLen = data.readUInt32LE(metadataEnd);
        const messageStart = metadataEnd + 4;
        const messageEnd = messageStart + messageLen;
        return {
            kind: 'InboxProcess',
            message: Buffer.from(data.subarray(messageStart, messageEnd)),
            metadata: Buffer.from(data.subarray(metadataStart, metadataEnd)),
        };
    }

    if (variant === 'OutboxDispatch') {
        // borsh: { sender: Pubkey, destination_domain: u32, recipient: H256, message_body: Vec<u8> }
        if (data.length < 1 + 32 + 4 + 32 + 4) return undefined;
        const sender = new PublicKey(data.subarray(1, 33));
        const destinationDomain = data.readUInt32LE(33);
        const recipient = new PublicKey(data.subarray(37, 69));
        const bodyLen = data.readUInt32LE(69);
        const messageBody = data.subarray(73, 73 + bodyLen);
        return {
            destinationDomain,
            kind: 'OutboxDispatch',
            messageBody: Buffer.from(messageBody),
            recipient,
            sender,
        };
    }

    return { kind: variant };
}

/**
 * Hyperlane V3 message layout (used in InboxProcess.message and Dispatched message PDA payload).
 *   version: u8
 *   nonce: u32 BE
 *   origin domain: u32 BE
 *   sender: 32 bytes
 *   destination domain: u32 BE
 *   recipient: 32 bytes
 *   body: rest
 *
 * Hyperlane uses big-endian for the on-the-wire message header (different from Borsh ix encoding).
 */
export type HyperlaneMessage = {
    version: number;
    nonce: number;
    originDomain: number;
    sender: PublicKey;
    destinationDomain: number;
    recipient: PublicKey;
    body: Buffer;
};

/* ----------------------------- Multisig ISM ----------------------------- */

export const ISM_TYPE_DISCRIMINATOR = Buffer.from([105, 97, 97, 88, 63, 124, 106, 18]);
export const ISM_VERIFY_DISCRIMINATOR = Buffer.from([243, 53, 214, 0, 208, 18, 231, 67]);
export const ISM_VERIFY_ACCOUNT_METAS_DISCRIMINATOR = Buffer.from([200, 65, 157, 12, 89, 255, 131, 216]);

export type MultisigIsmAdminVariant =
    | 'Initialize'
    | 'SetValidatorsAndThreshold'
    | 'GetOwner'
    | 'TransferOwnership';

const MULTISIG_ISM_ADMIN_VARIANTS: MultisigIsmAdminVariant[] = [
    'Initialize',
    'SetValidatorsAndThreshold',
    'GetOwner',
    'TransferOwnership',
];

export type DecodedMultisigIsm =
    | { kind: 'IsmType' }
    | { kind: 'IsmVerify'; metadata: Buffer; message: Buffer }
    | { kind: 'IsmVerifyAccountMetas'; metadata: Buffer; message: Buffer }
    | { kind: 'Initialize' | 'GetOwner' | 'TransferOwnership' }
    | { kind: 'SetValidatorsAndThreshold'; domain: number; validators: string[]; threshold: number };

export function decodeMultisigIsmInstruction(rawData: Buffer | Uint8Array): DecodedMultisigIsm | undefined {
    const data = toBuffer(rawData);

    // Interface (Type / Verify / VerifyAccountMetas) uses 8-byte hash discriminators
    if (startsWith(data, ISM_TYPE_DISCRIMINATOR)) return { kind: 'IsmType' };
    if (startsWith(data, ISM_VERIFY_DISCRIMINATOR)) {
        const verify = decodeVerifyInstruction(data.subarray(8));
        return verify ? { kind: 'IsmVerify', ...verify } : undefined;
    }
    if (startsWith(data, ISM_VERIFY_ACCOUNT_METAS_DISCRIMINATOR)) {
        const verify = decodeVerifyInstruction(data.subarray(8));
        return verify ? { kind: 'IsmVerifyAccountMetas', ...verify } : undefined;
    }

    // Admin instructions: [1;8] discriminator + 1-byte enum tag + payload
    if (!startsWith(data, WARP_DISCRIMINATOR)) return undefined;
    if (data.length < 9) return undefined;
    const variant = MULTISIG_ISM_ADMIN_VARIANTS[data[8]];
    if (!variant) return undefined;

    if (variant === 'SetValidatorsAndThreshold') {
        // Domained<T> { domain: u32, data: T }
        // ValidatorsAndThreshold { validators: Vec<H160>, threshold: u8 }
        if (data.length < 9 + 4 + 4) return undefined;
        const domain = data.readUInt32LE(9);
        const vecLen = data.readUInt32LE(13);
        const validatorsStart = 17;
        const validatorsEnd = validatorsStart + vecLen * 20;
        if (data.length < validatorsEnd + 1) return undefined;
        const validators: string[] = [];
        for (let i = 0; i < vecLen; i++) {
            const offset = validatorsStart + i * 20;
            validators.push('0x' + data.subarray(offset, offset + 20).toString('hex'));
        }
        const threshold = data[validatorsEnd];
        return { domain, kind: variant, threshold, validators };
    }

    return { kind: variant };
}

function decodeVerifyInstruction(rest: Buffer): { metadata: Buffer; message: Buffer } | undefined {
    if (rest.length < 4) return undefined;
    const metadataLen = rest.readUInt32LE(0);
    const metadataStart = 4;
    const metadataEnd = metadataStart + metadataLen;
    if (rest.length < metadataEnd + 4) return undefined;
    const messageLen = rest.readUInt32LE(metadataEnd);
    const messageStart = metadataEnd + 4;
    const messageEnd = messageStart + messageLen;
    return {
        message: Buffer.from(rest.subarray(messageStart, messageEnd)),
        metadata: Buffer.from(rest.subarray(metadataStart, metadataEnd)),
    };
}

/* ------------------------- Validator Announce ------------------------- */

export type ValidatorAnnounceVariant = 'Init' | 'Announce';

const VALIDATOR_ANNOUNCE_VARIANTS: ValidatorAnnounceVariant[] = ['Init', 'Announce'];

export type DecodedValidatorAnnounce =
    | { kind: 'Init'; mailbox: PublicKey; localDomain: number }
    | { kind: 'Announce'; validator: string; storageLocation: string };

export function decodeValidatorAnnounceInstruction(
    rawData: Buffer | Uint8Array
): DecodedValidatorAnnounce | undefined {
    const data = toBuffer(rawData);
    if (data.length < 1) return undefined;
    const variant = VALIDATOR_ANNOUNCE_VARIANTS[data[0]];
    if (!variant) return undefined;

    if (variant === 'Init') {
        if (data.length < 1 + 32 + 4) return undefined;
        return {
            kind: 'Init',
            localDomain: data.readUInt32LE(33),
            mailbox: new PublicKey(data.subarray(1, 33)),
        };
    }

    // Announce { validator: H160 (20 bytes), storage_location: String, signature: [u8; 65] }
    if (data.length < 1 + 20 + 4) return undefined;
    const validator = '0x' + data.subarray(1, 21).toString('hex');
    const strLen = data.readUInt32LE(21);
    const strStart = 25;
    const strEnd = strStart + strLen;
    if (data.length < strEnd) return undefined;
    const storageLocation = data.subarray(strStart, strEnd).toString('utf8');
    return { kind: 'Announce', storageLocation, validator };
}

/* -------------------------------- IGP -------------------------------- */

export type IgpVariant =
    | 'Init'
    | 'InitIgp'
    | 'InitOverheadIgp'
    | 'PayForGas'
    | 'QuoteGasPayment'
    | 'TransferIgpOwnership'
    | 'TransferOverheadIgpOwnership'
    | 'SetIgpBeneficiary'
    | 'SetDestinationGasOverheads'
    | 'SetGasOracleConfigs'
    | 'Claim';

const IGP_VARIANTS: IgpVariant[] = [
    'Init',
    'InitIgp',
    'InitOverheadIgp',
    'PayForGas',
    'QuoteGasPayment',
    'TransferIgpOwnership',
    'TransferOverheadIgpOwnership',
    'SetIgpBeneficiary',
    'SetDestinationGasOverheads',
    'SetGasOracleConfigs',
    'Claim',
];

type IgpKind = Exclude<IgpVariant, 'PayForGas' | 'QuoteGasPayment'>;

export type DecodedIgp =
    | { kind: 'PayForGas'; messageId: string; destinationDomain: number; gasAmount: bigint }
    | { kind: 'QuoteGasPayment'; destinationDomain: number; gasAmount: bigint }
    | { kind: IgpKind };

export function decodeIgpInstruction(rawData: Buffer | Uint8Array): DecodedIgp | undefined {
    const data = toBuffer(rawData);
    if (data.length < 1) return undefined;
    const variant = IGP_VARIANTS[data[0]];
    if (!variant) return undefined;

    if (variant === 'PayForGas') {
        // PayForGas { message_id: H256, destination_domain: u32, gas_amount: u64 }
        if (data.length < 1 + 32 + 4 + 8) return undefined;
        return {
            destinationDomain: data.readUInt32LE(33),
            gasAmount: data.readBigUInt64LE(37),
            kind: 'PayForGas',
            messageId: '0x' + data.subarray(1, 33).toString('hex'),
        };
    }

    if (variant === 'QuoteGasPayment') {
        if (data.length < 1 + 4 + 8) return undefined;
        return {
            destinationDomain: data.readUInt32LE(1),
            gasAmount: data.readBigUInt64LE(5),
            kind: 'QuoteGasPayment',
        };
    }

    return { kind: variant };
}

export function decodeHyperlaneMessage(rawMessage: Buffer | Uint8Array): HyperlaneMessage | undefined {
    const data = toBuffer(rawMessage);
    if (data.length < 1 + 4 + 4 + 32 + 4 + 32) return undefined;
    return {
        body: Buffer.from(data.subarray(77)),
        destinationDomain: data.readUInt32BE(41),
        nonce: data.readUInt32BE(1),
        originDomain: data.readUInt32BE(5),
        recipient: new PublicKey(data.subarray(45, 77)),
        sender: new PublicKey(data.subarray(9, 41)),
        version: data[0],
    };
}

/**
 * Hyperlane warp route TokenMessage body layout (on the wire, big-endian):
 *   [32 bytes recipient (H256)]
 *   [32 bytes amount_or_id (U256 big-endian)]
 *   [variable metadata]
 *
 * For this bridge metadata is empty.
 */
export type TokenMessage = {
    recipient: PublicKey;
    amount: bigint;
    metadata: Buffer;
};

export function decodeTokenMessage(rawBody: Buffer | Uint8Array): TokenMessage | undefined {
    const data = toBuffer(rawBody);
    if (data.length < 64) return undefined;
    const recipient = new PublicKey(data.subarray(0, 32));
    // amount is U256 big-endian; we read low 8 bytes (last 8 of the 32) as u64
    // since real transfers fit comfortably in u64.
    const amountBytes = data.subarray(32, 64);
    let amount = 0n;
    for (let i = 0; i < 32; i++) {
        amount = (amount << 8n) | BigInt(amountBytes[i]);
    }
    return {
        amount,
        metadata: Buffer.from(data.subarray(64)),
        recipient,
    };
}
