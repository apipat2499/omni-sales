import toast from 'react-hot-toast';

/**
 * Toast notification utilities
 * Wrapper around react-hot-toast with consistent styling
 */

const defaultOptions = {
  duration: 3000,
  position: 'bottom-right' as const,
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
  },
};

export const showToast = {
  /**
   * Show success toast
   */
  success: (message: string) => {
    return toast.success(message, {
      ...defaultOptions,
      style: {
        ...defaultOptions.style,
        background: '#10b981',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  },

  /**
   * Show error toast
   */
  error: (message: string) => {
    return toast.error(message, {
      ...defaultOptions,
      style: {
        ...defaultOptions.style,
        background: '#ef4444',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string) => {
    return toast.loading(message, defaultOptions);
  },

  /**
   * Show info toast
   */
  info: (message: string) => {
    return toast(message, {
      ...defaultOptions,
      icon: 'ℹ️',
      style: {
        ...defaultOptions.style,
        background: '#3b82f6',
        color: '#fff',
      },
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string) => {
    return toast(message, {
      ...defaultOptions,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        background: '#f59e0b',
        color: '#fff',
      },
    });
  },

  /**
   * Handle promise with toast notifications
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      defaultOptions
    );
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// Re-export toast for advanced usage
export { toast };
