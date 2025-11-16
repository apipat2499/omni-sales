/**
 * useNotificationService Hook
 *
 * React hook for managing email and SMS notifications,
 * queue management, and delivery status tracking.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getAllEmails,
  getEmailById,
  createEmail,
  createEmailFromTemplate,
  sendEmail,
  retryEmail,
  sendBulkEmails,
  processEmailQueue,
  getEmailsByStatus,
  deleteEmail,
  getEmailStats,
  type EmailMessage,
  type EmailStatus,
  type EmailStats,
} from '@/lib/utils/email-service';
import {
  getAllSMS,
  getSMSById,
  createSMS,
  createSMSFromTemplate,
  sendSMS,
  retrySMS,
  sendBulkSMS,
  processSMSQueue,
  getSMSByStatus,
  deleteSMS,
  getSMSStats,
  isOptedOut,
  addOptOut,
  removeOptOut,
  type SMSMessage,
  type SMSStatus,
  type SMSStats,
} from '@/lib/utils/sms-service';

// ============================================================================
// Type Definitions
// ============================================================================

export interface NotificationServiceState {
  emails: EmailMessage[];
  sms: SMSMessage[];
  emailStats: EmailStats;
  smsStats: SMSStats;
  isLoading: boolean;
  error: string | null;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
  metadata?: any;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}

export interface SendSMSParams {
  to: string;
  body: string;
  metadata?: any;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useNotificationService() {
  const [state, setState] = useState<NotificationServiceState>({
    emails: [],
    sms: [],
    emailStats: {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0,
    },
    smsStats: {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      optedOut: 0,
      deliveryRate: 0,
    },
    isLoading: false,
    error: null,
  });

  /**
   * Load all notifications
   */
  const loadNotifications = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const emails = getAllEmails();
      const sms = getAllSMS();
      const emailStats = getEmailStats();
      const smsStats = getSMSStats();

      setState({
        emails,
        sms,
        emailStats,
        smsStats,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load notifications',
      }));
    }
  }, []);

  /**
   * Load notifications on mount
   */
  useEffect(() => {
    loadNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // ========================================================================
  // Email Functions
  // ========================================================================

  /**
   * Send an email
   */
  const sendEmailNotification = useCallback(
    async (params: SendEmailParams): Promise<EmailMessage> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const email = createEmail({
          to: params.to,
          subject: params.subject,
          htmlContent: params.htmlContent,
          textContent: params.textContent,
          cc: params.cc,
          bcc: params.bcc,
          attachments: params.attachments,
          metadata: params.metadata,
          priority: params.priority,
          scheduledFor: params.scheduledFor,
        });

        // Send immediately if not scheduled
        if (!params.scheduledFor) {
          await sendEmail(email.id);
        }

        loadNotifications();
        return email;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to send email',
        }));
        throw error;
      }
    },
    [loadNotifications]
  );

  /**
   * Send email from template
   */
  const sendEmailFromTemplate = useCallback(
    async (
      templateId: string,
      to: string | string[],
      variables: Record<string, any>,
      options?: {
        subject?: string;
        cc?: string[];
        bcc?: string[];
        metadata?: any;
        priority?: 'low' | 'normal' | 'high';
        scheduledFor?: Date;
      }
    ): Promise<EmailMessage> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const email = createEmailFromTemplate(templateId, to, variables, options);

        // Send immediately if not scheduled
        if (!options?.scheduledFor) {
          await sendEmail(email.id);
        }

        loadNotifications();
        return email;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to send email from template',
        }));
        throw error;
      }
    },
    [loadNotifications]
  );

  /**
   * Retry failed email
   */
  const retryFailedEmail = useCallback(
    async (emailId: string): Promise<boolean> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const success = await retryEmail(emailId);
        loadNotifications();
        return success;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to retry email',
        }));
        return false;
      }
    },
    [loadNotifications]
  );

  /**
   * Send bulk emails
   */
  const sendBulkEmailNotifications = useCallback(
    async (emailIds: string[]): Promise<{ sent: number; failed: number }> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await sendBulkEmails(emailIds);
        loadNotifications();
        return result;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to send bulk emails',
        }));
        throw error;
      }
    },
    [loadNotifications]
  );

  /**
   * Process email queue
   */
  const processEmails = useCallback(async (): Promise<{ sent: number; failed: number }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await processEmailQueue();
      loadNotifications();
      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to process email queue',
      }));
      throw error;
    }
  }, [loadNotifications]);

  /**
   * Delete email
   */
  const removeEmail = useCallback(
    (emailId: string): boolean => {
      try {
        const success = deleteEmail(emailId);
        if (success) {
          loadNotifications();
        }
        return success;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to delete email',
        }));
        return false;
      }
    },
    [loadNotifications]
  );

  /**
   * Get email by ID
   */
  const getEmail = useCallback((emailId: string): EmailMessage | null => {
    return getEmailById(emailId);
  }, []);

  /**
   * Get emails by status
   */
  const getEmailsByStatusFilter = useCallback((status: EmailStatus): EmailMessage[] => {
    return getEmailsByStatus(status);
  }, []);

  // ========================================================================
  // SMS Functions
  // ========================================================================

  /**
   * Send an SMS
   */
  const sendSMSNotification = useCallback(
    async (params: SendSMSParams): Promise<SMSMessage> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const sms = createSMS({
          to: params.to,
          body: params.body,
          metadata: params.metadata,
          priority: params.priority,
          scheduledFor: params.scheduledFor,
        });

        // Send immediately if not scheduled
        if (!params.scheduledFor) {
          await sendSMS(sms.id);
        }

        loadNotifications();
        return sms;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to send SMS',
        }));
        throw error;
      }
    },
    [loadNotifications]
  );

  /**
   * Send SMS from template
   */
  const sendSMSFromTemplate = useCallback(
    async (
      templateId: string,
      to: string,
      variables: Record<string, any>,
      options?: {
        metadata?: any;
        priority?: 'low' | 'normal' | 'high';
        scheduledFor?: Date;
      }
    ): Promise<SMSMessage> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const sms = createSMSFromTemplate(templateId, to, variables, options);

        // Send immediately if not scheduled
        if (!options?.scheduledFor) {
          await sendSMS(sms.id);
        }

        loadNotifications();
        return sms;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to send SMS from template',
        }));
        throw error;
      }
    },
    [loadNotifications]
  );

  /**
   * Retry failed SMS
   */
  const retryFailedSMS = useCallback(
    async (smsId: string): Promise<boolean> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const success = await retrySMS(smsId);
        loadNotifications();
        return success;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to retry SMS',
        }));
        return false;
      }
    },
    [loadNotifications]
  );

  /**
   * Send bulk SMS
   */
  const sendBulkSMSNotifications = useCallback(
    async (smsIds: string[]): Promise<{ sent: number; failed: number }> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await sendBulkSMS(smsIds);
        loadNotifications();
        return result;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to send bulk SMS',
        }));
        throw error;
      }
    },
    [loadNotifications]
  );

  /**
   * Process SMS queue
   */
  const processSMSMessages = useCallback(async (): Promise<{ sent: number; failed: number }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await processSMSQueue();
      loadNotifications();
      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to process SMS queue',
      }));
      throw error;
    }
  }, [loadNotifications]);

  /**
   * Delete SMS
   */
  const removeSMS = useCallback(
    (smsId: string): boolean => {
      try {
        const success = deleteSMS(smsId);
        if (success) {
          loadNotifications();
        }
        return success;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to delete SMS',
        }));
        return false;
      }
    },
    [loadNotifications]
  );

  /**
   * Get SMS by ID
   */
  const getSMSMessage = useCallback((smsId: string): SMSMessage | null => {
    return getSMSById(smsId);
  }, []);

  /**
   * Get SMS by status
   */
  const getSMSByStatusFilter = useCallback((status: SMSStatus): SMSMessage[] => {
    return getSMSByStatus(status);
  }, []);

  /**
   * Check if phone is opted out
   */
  const checkOptOut = useCallback((phone: string): boolean => {
    return isOptedOut(phone);
  }, []);

  /**
   * Add opt-out
   */
  const addPhoneOptOut = useCallback(
    (phone: string, reason?: string): void => {
      addOptOut(phone, reason);
      loadNotifications();
    },
    [loadNotifications]
  );

  /**
   * Remove opt-out
   */
  const removePhoneOptOut = useCallback(
    (phone: string): boolean => {
      const success = removeOptOut(phone);
      if (success) {
        loadNotifications();
      }
      return success;
    },
    [loadNotifications]
  );

  // ========================================================================
  // Utility Functions
  // ========================================================================

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    // State
    emails: state.emails,
    sms: state.sms,
    emailStats: state.emailStats,
    smsStats: state.smsStats,
    isLoading: state.isLoading,
    error: state.error,

    // Email functions
    sendEmail: sendEmailNotification,
    sendEmailFromTemplate,
    retryEmail: retryFailedEmail,
    sendBulkEmails: sendBulkEmailNotifications,
    processEmailQueue: processEmails,
    deleteEmail: removeEmail,
    getEmail,
    getEmailsByStatus: getEmailsByStatusFilter,

    // SMS functions
    sendSMS: sendSMSNotification,
    sendSMSFromTemplate,
    retrySMS: retryFailedSMS,
    sendBulkSMS: sendBulkSMSNotifications,
    processSMSQueue: processSMSMessages,
    deleteSMS: removeSMS,
    getSMS: getSMSMessage,
    getSMSByStatus: getSMSByStatusFilter,

    // Opt-out functions
    isOptedOut: checkOptOut,
    addOptOut: addPhoneOptOut,
    removeOptOut: removePhoneOptOut,

    // Utility functions
    clearError,
    refresh,
  };
}

export default useNotificationService;
