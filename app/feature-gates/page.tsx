import FeatureGatesPageClient from './page-client';

export const metadata = {
    description: `Overview of the feature gates on Nara`,
    title: `Feature Gates | Nara`,
};

export default function FeatureGatesPage() {
    return <FeatureGatesPageClient />;
}
