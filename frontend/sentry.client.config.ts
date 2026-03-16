import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Only send errors in production
    enabled: process.env.NODE_ENV === "production",
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture replays for 10% of sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
  });
}

// Export a no-op function for consistency with Next.js Sentry usage
export const captureException = (error: unknown) => {
  // No-op when Sentry is not configured
  console.error('Sentry not configured:', error);
};

export const captureMessage = (message: string) => {
  // No-op when Sentry is not configured
  console.log('Sentry not configured:', message);
};