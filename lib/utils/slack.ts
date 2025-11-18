const salesWebhook =
  process.env.SALES_SLACK_WEBHOOK_URL ||
  process.env.SLACK_WEBHOOK_URL ||
  process.env.TELEMETRY_SLACK_WEBHOOK_URL ||
  process.env.TELEMETRY_SLACK_WEBHOOK;

interface SalesNotification {
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function notifySalesLead(payload: SalesNotification) {
  if (!salesWebhook || typeof fetch === 'undefined') {
    return;
  }

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${payload.title}*\n${payload.message}`,
      },
    },
  ];

  if (payload.metadata) {
    const fields = Object.entries(payload.metadata)
      .filter(([, value]) => value)
      .map(([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${value}`,
      }));

    if (fields.length) {
      blocks.push({
        type: 'section',
        fields,
      });
    }
  }

  await fetch(salesWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: payload.title,
      blocks,
    }),
  });
}
