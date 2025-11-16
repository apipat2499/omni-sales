import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(accountSid, authToken);

export async function sendSMS(phoneNumber: string, message: string) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: phoneNumber,
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("SMS send error:", error);
    throw error;
  }
}

export async function sendOrderSMS(phoneNumber: string, orderId: string, status: string) {
  const messages: Record<string, string> = {
    pending: `Your order #${orderId} has been received. We will process it soon.`,
    processing: `Your order #${orderId} is being prepared for shipment.`,
    shipped: `Your order #${orderId} has been shipped! Track it on our app.`,
    delivered: `Your order #${orderId} has been delivered. Thanks for shopping!`,
    cancelled: `Your order #${orderId} has been cancelled.`,
  };

  const message = messages[status] || messages.pending;
  return await sendSMS(phoneNumber, message);
}

export async function sendBulkSMS(phoneNumbers: string[], message: string) {
  try {
    const results = await Promise.all(
      phoneNumbers.map((phone) => sendSMS(phone, message))
    );

    return {
      success: true,
      sent: results.length,
      results,
    };
  } catch (error) {
    console.error("Bulk SMS error:", error);
    throw error;
  }
}

export default {
  sendSMS,
  sendOrderSMS,
  sendBulkSMS,
};
