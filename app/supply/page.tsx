import SupplyPageClient from './page-client';

export const metadata = {
    description: `Overview of the native token supply on Nara`,
    title: `Supply Overview | Nara`,
};

export default function SupplyPage() {
    return <SupplyPageClient />;
}
