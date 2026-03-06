import * as Sentry from '@sentry/nextjs';

const sentryDisabled = process.env.NEXT_DISABLE_SENTRY === 'true';

export async function register() {
    if (sentryDisabled) {
        return;
    }

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
    }
}

export const onRequestError = (...args: Parameters<typeof Sentry.captureRequestError>) => {
    if (sentryDisabled) {
        return;
    }

    return Sentry.captureRequestError(...args);
};
