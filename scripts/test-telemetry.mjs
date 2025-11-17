#!/usr/bin/env node

import process from 'node:process';

const webhook =
  process.env.SLACK_WEBHOOK_URL ||
  process.env.TELEMETRY_SLACK_WEBHOOK_URL ||
  process.env.TELEMETRY_SLACK_WEBHOOK;

const message =
  process.argv.slice(2).join(' ') || 'Telemetry test message from scripts/test-telemetry.mjs';

async function main() {
  if (!webhook) {
    console.error(
      'Missing SLACK_WEBHOOK_URL (or TELEMETRY_SLACK_WEBHOOK_URL / TELEMETRY_SLACK_WEBHOOK).'
    );
    process.exit(1);
  }

  const payload = {
    text: `:satellite: ${message}\nRepository: ${process.env.GITHUB_REPOSITORY || 'local run'}`,
  };

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook responded with ${response.status}: ${text}`);
  }

  console.log('Telemetry test message delivered to Slack.');
}

main().catch((error) => {
  console.error('Failed to deliver telemetry test message:', error);
  process.exit(1);
});
