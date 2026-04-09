import { ParsedTokenExtension } from '@/app/components/account/types';
import { TokenExtensionType } from '@/app/validators/accounts/token-extension';

function populateNaraDevelopersLink(component: string) {
    return `https://nara.build/docs/token-extensions/${component}`;
}

export function populatePartialParsedTokenExtension(
    extension: TokenExtensionType
): Omit<ParsedTokenExtension, 'parsed' | 'extension'> {
    function populateExternalLinks(url: string) {
        return [{ label: 'Docs', url }];
    }

    switch (extension) {
        case 'transferFeeAmount': {
            const description =
                "Every transfer sets aside a fee in the recipient's Token Account that can only be withdrawn by the Withdraw Authority";
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('transfer-fee')),
                name: 'Transfer Fee Amount',
                status: 'active',
                tooltip: description,
            };
        }
        case 'mintCloseAuthority': {
            const description = 'Allows a designated Close Authority to close the mint account if the supply is 0';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('mint-close-authority')),
                name: 'Mint Close Authority',
                status: 'active',
                tooltip: description,
            };
        }
        case 'defaultAccountState': {
            const description = 'Enables the authority to make new token accounts as frozen by default upon creation';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('default-account-state')),
                name: 'Default Account State',
                status: 'active',
                tooltip: description,
            };
        }
        case 'immutableOwner': {
            const description = 'Prevents the owner from being changed';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('immutable-owner')),
                name: 'Immutable Owner',
                status: 'active',
                tooltip: description,
            };
        }
        case 'memoTransfer': {
            const description = 'Requires all incoming transfers to a token account include a memo';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('required-memo')),
                name: 'Required Memo',
                status: 'active',
                tooltip: description,
            };
        }
        case 'nonTransferable': {
            return {
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('non-transferable-token')),
                name: 'Non-Transferable Token',
                status: 'active',
            };
        }
        case 'nonTransferableAccount': {
            return {
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('non-transferable-token')),
                name: 'Non-Transferable Token Account',
                status: 'active',
            };
        }
        case 'cpiGuard': {
            const description = 'Prohibits certain actions inside cross-program invocations';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('cpi-guard')),
                name: 'CPI Guard',
                status: 'active',
                tooltip: description,
            };
        }
        case 'permanentDelegate': {
            const description =
                'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('permanent-delegate')),
                name: 'Permanent Delegate',
                status: 'active',
                tooltip: description,
            };
        }
        case 'transferHook': {
            const description = 'Allow the token program to execute custom instruction logic on every token transfer';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('transfer-hook')),
                name: 'Transfer Hook',
                status: 'active',
                tooltip: description,
            };
        }
        case 'transferHookAccount': {
            return {
                description: "This is only set to 'transferring' inside the transferHook CPI",
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('transfer-hook')),
                name: 'Transfer Hook Account Info',
                status: 'active',
            };
        }
        case 'metadataPointer': {
            const description = 'Describes the location of the token metadata';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('metadata-pointer')),
                name: 'Metadata Pointer',
                status: 'active',
                tooltip: description,
            };
        }
        case 'groupPointer': {
            return {
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('group-member')),
                name: 'Group Pointer',
                status: 'active',
            };
        }
        case 'groupMemberPointer': {
            return {
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('group-member')),
                name: 'Group Member Pointer',
                status: 'active',
            };
        }
        case 'confidentialTransferAccount': {
            const description = 'Token amount is only able to be unencrypted by the token holder or auditor key';
            return {
                description,
                externalLinks: populateExternalLinks('https://nara.build/docs/confidential-token'),
                name: 'Confidential Transfer Token Info',
                status: 'active',
                tooltip: description,
            };
        }
        case 'confidentialTransferFeeConfig': {
            return {
                externalLinks: populateExternalLinks('https://nara.build/docs/confidential-token'),
                name: 'Confidential Transfer Fee Config',
                status: 'active',
            };
        }
        case 'confidentialTransferFeeAmount': {
            return {
                externalLinks: populateExternalLinks('https://nara.build/docs/confidential-token'),
                name: 'Confidential Transfer Fee Amount',
                status: 'active',
            };
        }
        case 'confidentialTransferMint': {
            const description =
                'Allow token holders to opt-in to encrypted balances that are accessible only to them and the auditor';
            return {
                description,
                externalLinks: populateExternalLinks('https://nara.build/docs/confidential-token'),
                name: 'Confidential Transfer',
                status: 'active',
                tooltip: description,
            };
        }
        case 'interestBearingConfig': {
            const description = 'Allows the token balance to be displayed with accumulated interest';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('interest-bearing-token')),
                name: 'Interest Bearing Token Configuration',
                status: 'active',
                tooltip: description,
            };
        }
        case 'transferFeeConfig': {
            const description =
                'Allows a fee to be set aside on every transfer that can only be withdrawn by the Withdraw Authority';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('transfer-fee')),
                name: 'Transfer Fee',
                status: 'active',
                tooltip: description,
            };
        }
        case 'tokenGroup': {
            return {
                externalLinks: [],
                name: 'Token Group',
                status: 'active',
            };
        }
        case 'tokenGroupMember': {
            return {
                externalLinks: [],
                name: 'Token Group Member',
                status: 'active',
            };
        }
        case 'tokenMetadata': {
            const description = 'Allows metadata to be written directly to the mint account';
            return {
                description,
                externalLinks: populateExternalLinks(populateNaraDevelopersLink('metadata-pointer')),
                name: 'Token Metadata',
                status: 'active',
                tooltip: description,
            };
        }
        case 'scaledUiAmountConfig': {
            const description =
                'Allows the token program to scale the UI amount of the token by an updatable multiplier';
            return {
                description,
                externalLinks: [{ label: 'Docs', url: 'https://nara.build/docs/token-extensions/scaled-ui-amount' }],
                name: 'Scaled UI Amount',
                status: 'active',
                tooltip: description,
            };
        }
        case 'pausableAccount': {
            return {
                externalLinks: [
                    { label: 'Docs', url: 'https://www.solana-program.com/docs/token-2022/extensions#pausable' },
                ],
                name: 'Pausable Account',
                status: 'active',
                tooltip: 'This account can be paused by the Pausable extension',
            };
        }
        case 'pausableConfig': {
            const description =
                'Allows the token program to pause all interactions including transfers, mints, and burns';
            return {
                description,
                externalLinks: [
                    { label: 'Docs', url: 'https://www.solana-program.com/docs/token-2022/extensions#pausable' },
                ],
                name: 'Pausable',
                status: 'active',
                tooltip: description,
            };
        }
        case 'unparseableExtension':
        default:
            return {
                externalLinks: [],
                name: 'Unknown Extension',
                status: 'active',
            };
    }
}
