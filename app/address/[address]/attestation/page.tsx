import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import AttestationPageClient from './page-client';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Attestation Data for the Attestation Account with address ${props.params.address} on Nara`,
        title: `Attestation Data | ${await getReadableTitleFromAddress(props)} | Nara`,
    };
}

export default function AttestationPage(props: Props) {
    return <AttestationPageClient {...props} />;
}
