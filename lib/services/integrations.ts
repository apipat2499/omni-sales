import axios from "axios";

// Slack Integration
export async function sendToSlack(webhookUrl: string, message: string, metadata?: any) {
  try {
    const payload = {
      text: message,
      attachments: metadata ? [
        {
          color: "good",
          fields: Object.entries(metadata).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
        }
      ] : undefined,
    };

    const response = await axios.post(webhookUrl, payload);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("Slack integration error:", error);
    throw error;
  }
}

// Discord Integration
export async function sendToDiscord(webhookUrl: string, message: string, metadata?: any) {
  try {
    const embed = metadata ? {
      title: "Alert",
      description: message,
      fields: Object.entries(metadata).map(([name, value]) => ({
        name,
        value: String(value),
        inline: true,
      })),
      color: 5763719,
    } : undefined;

    const payload = {
      content: message,
      embeds: embed ? [embed] : undefined,
    };

    const response = await axios.post(webhookUrl, payload);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("Discord integration error:", error);
    throw error;
  }
}

// Send order notifications to integrations
export async function notifyOrderStatus(
  orderId: string,
  status: string,
  slackWebhook?: string,
  discordWebhook?: string
) {
  try {
    const message = `Order #${orderId} status: ${status}`;
    const metadata = { orderId, status, timestamp: new Date().toISOString() };

    const results = [];

    if (slackWebhook) {
      results.push(await sendToSlack(slackWebhook, message, metadata));
    }

    if (discordWebhook) {
      results.push(await sendToDiscord(discordWebhook, message, metadata));
    }

    return { success: true, results };
  } catch (error) {
    console.error("Notify integration error:", error);
    throw error;
  }
}

export default {
  sendToSlack,
  sendToDiscord,
  notifyOrderStatus,
};
