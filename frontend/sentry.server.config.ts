import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
  });
}

// Export no-op functions for consistency
export const captureException = (error: unknown) => {
  // No-op when Sentry is not configured
  console.error('Sentry not configured:', error);
};

export const captureMessage = (message: string) => {
  // No-op when Sentry is not configured
  console.log('Sentry not configured:', message);
};