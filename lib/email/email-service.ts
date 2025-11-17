// Re-export from service
export * from './service';

// Stub function for sendEmail
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('sendEmail called with:', options);
  // This is a stub implementation
  return { success: true, messageId: 'stub-message-id' };
}
