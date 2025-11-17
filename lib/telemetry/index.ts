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
}

function enrichEvent(event: TelemetryEvent) {
  return {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };
}
