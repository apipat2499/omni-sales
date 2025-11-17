// Re-export from service
export * from './service';

// Stub function for sendSMS
export async function sendSMS(options: {
  to: string;
  message: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('sendSMS called with:', options);
  // This is a stub implementation
  return { success: true, messageId: 'stub-sms-id' };
}
