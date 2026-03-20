#!/usr/bin/env ts-node
/**
 * Setup QStash schedules for cron jobs
 *
 * Usage: npx tsx scripts/setup-qstash.ts
 *
 * Requires QSTASH_URL and QSTASH_TOKEN in .env.local
 * Requires CRON_SECRET in .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('.env.local not found');
  process.exit(1);
}

const QSTASH_URL = process.env.QSTASH_URL;
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

if (!QSTASH_URL || !QSTASH_TOKEN || !CRON_SECRET) {
  console.error('Missing required env vars: QSTASH_URL, QSTASH_TOKEN, CRON_SECRET');
  process.exit(1);
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.vercel.app';

interface Schedule {
  path: string;
  schedule: string;
  label: string;
}

const schedules: Schedule[] = [
  {
    path: '/api/cron/job-expiry',
    schedule: '* * * * *', // every minute
    label: 'job-expiry',
  },
  {
    path: '/api/cron/auto-approve',
    schedule: '0 * * * *', // every hour at minute 0
    label: 'auto-approve',
  },
];

async function createSchedule(schedule: Schedule) {
  const url = `${QSTASH_URL}/v1/schedules`;
  const destination = `${BASE_URL}${schedule.path}?secret=${CRON_SECRET}`;

  console.log(`Creating schedule: ${schedule.label}`);
  console.log(`  Destination: ${destination}`);
  console.log(`  Schedule: ${schedule.schedule}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destination,
      schedule: schedule.schedule,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  Failed: ${response.status} - ${error}`);
    return false;
  }

  const result = await response.json();
  console.log(`  Success! Schedule ID: ${result.scheduleId}`);
  return true;
}

async function main() {
  console.log('Setting up QStash schedules...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  for (const schedule of schedules) {
    await createSchedule(schedule);
    console.log('');
  }

  console.log('Done!');
}

main().catch(console.error);