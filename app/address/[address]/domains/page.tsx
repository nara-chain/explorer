import { DomainsCard } from '@entities/domain';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Domain names owned by the address ${props.params.address} on Nara`,
        title: `Domains | ${await getReadableTitleFromAddress(props)} | Nara`,
    };
}

export default function OwnedDomainsPage({ params: { address } }: Props) {
    return <DomainsCard address={address} />;
}
