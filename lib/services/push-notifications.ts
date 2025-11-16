import admin from "firebase-admin";

// Initialize Firebase Admin (configure in your environment)
let firebaseApp: admin.app.App;

try {
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_ADMIN_SDK || "{}")
      ),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.warn("Firebase not initialized:", error);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  image?: string;
  badge?: string;
  clickAction?: string;
}

export interface DeviceToken {
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  createdAt: string;
}

/**
 * Send push notification to single device
 */
export async function sendPushNotification(
  deviceToken: string,
  payload: PushNotificationPayload
) {
  try {
    if (!firebaseApp) {
      console.error("Firebase not initialized");
      return { success: false, error: "Firebase not initialized" };
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      data: payload.data || {},
      token: deviceToken,
    };

    const response = await admin.messaging().send(message as any);

    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error("Push notification error:", error);
    throw error;
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendPushNotificationToMultiple(
  deviceTokens: string[],
  payload: PushNotificationPayload
) {
  try {
    if (!firebaseApp) {
      return { success: false, error: "Firebase not initialized" };
    }

    const messages = deviceTokens.map((token) => ({
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      data: payload.data || {},
      token,
    }));

    const response = await admin.messaging().sendAll(messages as any);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error("Batch push notification error:", error);
    throw error;
  }
}

/**
 * Send notification to all devices of a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload,
  db: any // Supabase client
) {
  try {
    // Get all device tokens for user
    const { data: devices, error } = await db
      .from("user_device_tokens")
      .select("token")
      .eq("user_id", userId);

    if (error) throw error;

    if (!devices || devices.length === 0) {
      return { success: true, message: "No devices found for user" };
    }

    const tokens = devices.map((d: any) => d.token);
    return await sendPushNotificationToMultiple(tokens, payload);
  } catch (error) {
    console.error("Send to user error:", error);
    throw error;
  }
}

/**
 * Register device token for user
 */
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: "ios" | "android" | "web",
  db: any
) {
  try {
    const { error } = await db.from("user_device_tokens").upsert({
      user_id: userId,
      token,
      platform,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Register device token error:", error);
    throw error;
  }
}

/**
 * Unregister device token
 */
export async function unregisterDeviceToken(token: string, db: any) {
  try {
    const { error } = await db
      .from("user_device_tokens")
      .delete()
      .eq("token", token);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Unregister device token error:", error);
    throw error;
  }
}

/**
 * Send order notification
 */
export async function sendOrderNotification(
  userId: string,
  orderId: string,
  status: string,
  db: any
) {
  const messages: Record<string, PushNotificationPayload> = {
    pending: {
      title: "Order Received",
      body: `Order #${orderId} has been received and is being processed.`,
      data: { orderId, status },
    },
    processing: {
      title: "Order Processing",
      body: `Order #${orderId} is being prepared for shipment.`,
      data: { orderId, status },
    },
    shipped: {
      title: "Order Shipped",
      body: `Order #${orderId} has been shipped! Track your package.`,
      data: { orderId, status },
    },
    delivered: {
      title: "Order Delivered",
      body: `Order #${orderId} has been delivered successfully.`,
      data: { orderId, status },
    },
    cancelled: {
      title: "Order Cancelled",
      body: `Order #${orderId} has been cancelled.`,
      data: { orderId, status },
    },
  };

  const payload = messages[status] || messages.pending;
  return await sendPushNotificationToUser(userId, payload, db);
}

/**
 * Send promotional notification
 */
export async function sendPromotionalNotification(
  userIds: string[],
  title: string,
  body: string,
  imageUrl: string,
  deepLink: string,
  db: any
) {
  try {
    // Get all device tokens for users
    const { data: devices, error } = await db
      .from("user_device_tokens")
      .select("token")
      .in("user_id", userIds);

    if (error) throw error;

    const tokens = devices?.map((d: any) => d.token) || [];

    if (tokens.length === 0) {
      return { success: true, message: "No devices found" };
    }

    return await sendPushNotificationToMultiple(tokens, {
      title,
      body,
      image: imageUrl,
      data: { deepLink },
      clickAction: "FLUTTER_NOTIFICATION_CLICK",
    });
  } catch (error) {
    console.error("Send promotional notification error:", error);
    throw error;
  }
}

export default {
  sendPushNotification,
  sendPushNotificationToMultiple,
  sendPushNotificationToUser,
  registerDeviceToken,
  unregisterDeviceToken,
  sendOrderNotification,
  sendPromotionalNotification,
};
