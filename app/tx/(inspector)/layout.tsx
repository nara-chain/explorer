import '@/app/styles.css';

import { Metadata } from 'next/types';
import React from 'react';

type Props = Readonly<{
    children: React.ReactNode;
    params: Readonly<{
        signature: string;
    }>;
}>;

export async function generateMetadata({ params: { signature } }: Props): Promise<Metadata> {
    if (signature) {
        return {
            description: `Interactively inspect the Nara transaction with signature ${signature}`,
            title: `Transaction Inspector | ${signature} | Nara`,
        };
    } else {
        return {
            description: `Interactively inspect Nara transactions`,
            title: `Transaction Inspector | Nara`,
        };
    }
}

export default function TransactionInspectorLayout({ children }: Props) {
    return children;
}
