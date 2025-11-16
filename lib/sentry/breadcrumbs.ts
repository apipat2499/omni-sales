/**
 * Sentry Breadcrumbs Tracking Utilities
 * Helpers for logging user actions, API calls, and navigation events
 */

import * as Sentry from '@sentry/nextjs';
import { addSentryBreadcrumb } from './init';

/**
 * Track user actions as breadcrumbs
 */
export const trackUserAction = {
  /**
   * Track button clicks
   */
  click: (buttonName: string, data?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `User clicked: ${buttonName}`,
      category: 'user.action',
      level: 'info',
      data: {
        action: 'click',
        button: buttonName,
        ...data,
      },
    });
  },

  /**
   * Track form submissions
   */
  submit: (formName: string, data?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `User submitted form: ${formName}`,
      category: 'user.action',
      level: 'info',
      data: {
        action: 'submit',
        form: formName,
        ...data,
      },
    });
  },

  /**
   * Track input changes (use sparingly to avoid too many breadcrumbs)
   */
  input: (fieldName: string, data?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `User changed input: ${fieldName}`,
      category: 'user.action',
      level: 'info',
      data: {
        action: 'input',
        field: fieldName,
        ...data,
      },
    });
  },

  /**
   * Track tab/view changes
   */
  viewChange: (viewName: string, data?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `User changed view: ${viewName}`,
      category: 'user.action',
      level: 'info',
      data: {
        action: 'view_change',
        view: viewName,
        ...data,
      },
    });
  },

  /**
   * Track search actions
   */
  search: (query: string, filters?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `User searched: ${query}`,
      category: 'user.action',
      level: 'info',
      data: {
        action: 'search',
        query,
        filters,
      },
    });
  },

  /**
   * Track filter changes
   */
  filter: (filterName: string, value: any) => {
    addSentryBreadcrumb({
      message: `User applied filter: ${filterName}`,
      category: 'user.action',
      level: 'info',
      data: {
        action: 'filter',
        filter: filterName,
        value,
      },
    });
  },

  /**
   * Track sorting changes
   */
  sort: (field: string, direction: 'asc' | 'desc') => {
    addSentryBreadcrumb({
      message: `User sorted by: ${field} ${direction}`,
      category: 'user.action',
      level: 'info',
      data: {
        action: 'sort',
        field,
        direction,
      },
    });
  },
};

/**
 * Track API calls as breadcrumbs
 */
export const trackAPICall = {
  /**
   * Track API request start
   */
  start: (endpoint: string, method: string, data?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `API Request: ${method} ${endpoint}`,
      category: 'http',
      level: 'info',
      data: {
        type: 'request',
        endpoint,
        method,
        ...data,
      },
    });
  },

  /**
   * Track successful API response
   */
  success: (endpoint: string, status: number, duration?: number) => {
    addSentryBreadcrumb({
      message: `API Success: ${endpoint} (${status})`,
      category: 'http',
      level: 'info',
      data: {
        type: 'response',
        endpoint,
        status,
        duration_ms: duration,
        success: true,
      },
    });
  },

  /**
   * Track failed API response
   */
  error: (endpoint: string, status: number, error?: string, duration?: number) => {
    addSentryBreadcrumb({
      message: `API Error: ${endpoint} (${status})`,
      category: 'http',
      level: 'error',
      data: {
        type: 'response',
        endpoint,
        status,
        error,
        duration_ms: duration,
        success: false,
      },
    });
  },

  /**
   * Track API timeout
   */
  timeout: (endpoint: string, timeout: number) => {
    addSentryBreadcrumb({
      message: `API Timeout: ${endpoint}`,
      category: 'http',
      level: 'warning',
      data: {
        type: 'timeout',
        endpoint,
        timeout_ms: timeout,
      },
    });
  },
};

/**
 * Track navigation events as breadcrumbs
 */
export const trackNavigation = {
  /**
   * Track page navigation
   */
  navigate: (from: string, to: string, method?: 'push' | 'replace' | 'back' | 'forward') => {
    addSentryBreadcrumb({
      message: `Navigation: ${from} → ${to}`,
      category: 'navigation',
      level: 'info',
      data: {
        from,
        to,
        method: method || 'push',
      },
    });
  },

  /**
   * Track route change
   */
  routeChange: (route: string, params?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `Route changed: ${route}`,
      category: 'navigation',
      level: 'info',
      data: {
        route,
        params,
      },
    });
  },

  /**
   * Track external link clicks
   */
  externalLink: (url: string) => {
    addSentryBreadcrumb({
      message: `External link clicked: ${url}`,
      category: 'navigation',
      level: 'info',
      data: {
        type: 'external',
        url,
      },
    });
  },
};

/**
 * Track data operations as breadcrumbs
 */
export const trackDataOperation = {
  /**
   * Track data fetch
   */
  fetch: (resource: string, params?: Record<string, any>) => {
    addSentryBreadcrumb({
      message: `Data fetch: ${resource}`,
      category: 'data',
      level: 'info',
      data: {
        operation: 'fetch',
        resource,
        params,
      },
    });
  },

  /**
   * Track data create
   */
  create: (resource: string, id?: string) => {
    addSentryBreadcrumb({
      message: `Data created: ${resource}`,
      category: 'data',
      level: 'info',
      data: {
        operation: 'create',
        resource,
        id,
      },
    });
  },

  /**
   * Track data update
   */
  update: (resource: string, id: string, fields?: string[]) => {
    addSentryBreadcrumb({
      message: `Data updated: ${resource}/${id}`,
      category: 'data',
      level: 'info',
      data: {
        operation: 'update',
        resource,
        id,
        fields,
      },
    });
  },

  /**
   * Track data delete
   */
  delete: (resource: string, id: string) => {
    addSentryBreadcrumb({
      message: `Data deleted: ${resource}/${id}`,
      category: 'data',
      level: 'info',
      data: {
        operation: 'delete',
        resource,
        id,
      },
    });
  },
};

/**
 * Track authentication events
 */
export const trackAuth = {
  /**
   * Track login
   */
  login: (method: string, userId?: string) => {
    addSentryBreadcrumb({
      message: `User logged in via ${method}`,
      category: 'auth',
      level: 'info',
      data: {
        action: 'login',
        method,
        user_id: userId,
      },
    });
  },

  /**
   * Track logout
   */
  logout: (userId?: string) => {
    addSentryBreadcrumb({
      message: 'User logged out',
      category: 'auth',
      level: 'info',
      data: {
        action: 'logout',
        user_id: userId,
      },
    });
  },

  /**
   * Track session refresh
   */
  refresh: () => {
    addSentryBreadcrumb({
      message: 'Session refreshed',
      category: 'auth',
      level: 'info',
      data: {
        action: 'refresh',
      },
    });
  },

  /**
   * Track authentication error
   */
  error: (error: string, method?: string) => {
    addSentryBreadcrumb({
      message: `Auth error: ${error}`,
      category: 'auth',
      level: 'error',
      data: {
        action: 'error',
        error,
        method,
      },
    });
  },
};

/**
 * Track application state changes
 */
export const trackStateChange = {
  /**
   * Track theme change
   */
  theme: (theme: 'light' | 'dark') => {
    addSentryBreadcrumb({
      message: `Theme changed to ${theme}`,
      category: 'ui',
      level: 'info',
      data: {
        type: 'theme',
        theme,
      },
    });
  },

  /**
   * Track language change
   */
  language: (language: string) => {
    addSentryBreadcrumb({
      message: `Language changed to ${language}`,
      category: 'ui',
      level: 'info',
      data: {
        type: 'language',
        language,
      },
    });
  },

  /**
   * Track modal open/close
   */
  modal: (action: 'open' | 'close', modalName: string) => {
    addSentryBreadcrumb({
      message: `Modal ${action}: ${modalName}`,
      category: 'ui',
      level: 'info',
      data: {
        type: 'modal',
        action,
        modal: modalName,
      },
    });
  },
};

/**
 * Helper to track performance metrics
 */
export const trackPerformance = {
  /**
   * Track page load time
   */
  pageLoad: (duration: number, route: string) => {
    addSentryBreadcrumb({
      message: `Page loaded: ${route}`,
      category: 'performance',
      level: 'info',
      data: {
        type: 'page_load',
        route,
        duration_ms: duration,
      },
    });
  },

  /**
   * Track component render time
   */
  componentRender: (componentName: string, duration: number) => {
    addSentryBreadcrumb({
      message: `Component rendered: ${componentName}`,
      category: 'performance',
      level: 'info',
      data: {
        type: 'component_render',
        component: componentName,
        duration_ms: duration,
      },
    });
  },
};
