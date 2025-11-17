import * as Sentry from '@sentry/nextjs';

type TelemetryLevel = 'info' | 'warning' | 'error';

export interface TelemetryEvent {
  type: string;
  level?: TelemetryLevel;
  message: string;
  context?: Record<string, unknown>;
  source?: 'client' | 'server' | 'middleware';
  timestamp?: string;
}

const shouldLog =
  process.env.NODE_ENV !== 'production' ||
  process.env.ENABLE_SECURITY_LOGGING === 'true';

const slackWebhookUrl =
  process.env.SLACK_WEBHOOK_URL ||
  process.env.TELEMETRY_SLACK_WEBHOOK_URL ||
  process.env.TELEMETRY_SLACK_WEBHOOK;

export async function trackClientTelemetry(event: TelemetryEvent) {
  if (typeof window === 'undefined') return;
  const payload = enrichEvent({ ...event, source: 'client' });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/telemetry', blob);
    } else {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    if (shouldLog) {
      console.warn('[Telemetry] Failed to send event', error);
    }
  }
}

export function logServerTelemetry(event: TelemetryEvent) {
  const payload = enrichEvent({ ...event, source: event.source ?? 'server' });
  if (shouldLog) {
    console.log('[Telemetry]', payload);
  }
  void dispatchToTargets(payload);
}

export async function dispatchTelemetry(event: TelemetryEvent) {
  const payload = enrichEvent({ ...event, source: event.source ?? 'server' });
  if (shouldLog) {
    console.log('[Telemetry]', payload);
  }
  await dispatchToTargets(payload);
  return payload;
}

function enrichEvent(event: TelemetryEvent) {
  return {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };
}

async function dispatchToTargets(event: TelemetryEvent) {
  await Promise.all([notifySlack(event), notifySentry(event)]);
}

async function notifySlack(event: TelemetryEvent) {
  if (!slackWebhookUrl || typeof fetch === 'undefined') {
    return;
  }

  const emoji =
    event.level === 'error' ? '❌' : event.level === 'warning' ? '⚠️' : 'ℹ️';

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} ${event.type}: ${event.message}${
          event.context ? `\n\`\`\`${JSON.stringify(event.context, null, 2)}\`\`\`` : ''
        }`,
      }),
    });
  } catch (error) {
    if (shouldLog) {
      console.warn('[Telemetry] Failed to notify Slack', error);
    }
  }
}

async function notifySentry(event: TelemetryEvent) {
  try {
    const level = event.level ?? 'info';
    Sentry.captureMessage(`[Telemetry] ${event.type}: ${event.message}`, {
      level,
      extra: event.context,
    });
  } catch (error) {
    if (shouldLog) {
      console.warn('[Telemetry] Failed to notify Sentry', error);
    }
  }
}
