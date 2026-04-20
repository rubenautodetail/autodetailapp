import { Client, Receiver } from '@upstash/qstash';

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

// QStash publisher — used to enqueue delayed jobs
export function getQStashClient(): Client {
    return new Client({ token: requireEnv('QSTASH_TOKEN') });
}

// QStash receiver — used to verify incoming webhook signatures
export function getQStashReceiver(): Receiver {
    return new Receiver({
        currentSigningKey: requireEnv('QSTASH_CURRENT_SIGNING_KEY'),
        nextSigningKey: requireEnv('QSTASH_NEXT_SIGNING_KEY'),
    });
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dtailwash.com';
