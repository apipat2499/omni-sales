/**
 * usePresence Hook
 *
 * React hook for user presence tracking with:
 * - Online/offline status
 * - Active user list
 * - Activity tracking
 * - Location tracking
 * - Real-time updates
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketClient, WebSocketMessage } from '../utils/websocket-client';

export interface PresenceData {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentLocation: {
    page: string;
    section?: string;
  };
  activity?: string;
  mousePosition?: { x: number; y: number };
}

export interface UsePresenceOptions {
  wsClient: WebSocketClient;
  userId: string;
  username: string;
  avatar?: string;
  initialPage?: string;
  initialSection?: string;
  trackMouse?: boolean;
  awayTimeout?: number; // milliseconds
  broadcastInterval?: number; // milliseconds
  debug?: boolean;
}

export interface UsePresenceReturn {
  // Current user
  currentUser: PresenceData;
  status: 'online' | 'away' | 'offline';

  // Active users
  activeUsers: PresenceData[];
  onlineCount: number;
  awayCount: number;

  // Methods
  setStatus: (status: 'online' | 'away' | 'offline') => void;
  setLocation: (page: string, section?: string) => void;
  setActivity: (activity: string) => void;
  updateMousePosition: (x: number, y: number) => void;
  subscribe: (callback: (users: PresenceData[]) => void) => () => void;
}

/**
 * Hook for user presence tracking
 */
export function usePresence(options: UsePresenceOptions): UsePresenceReturn {
  const {
    wsClient,
    userId,
    username,
    avatar,
    initialPage = 'dashboard',
    initialSection,
    trackMouse = false,
    awayTimeout = 300000, // 5 minutes
    broadcastInterval = 10000, // 10 seconds
    debug = false,
  } = options;

  const [currentUser, setCurrentUser] = useState<PresenceData>({
    userId,
    username,
    avatar,
    status: 'online',
    lastSeen: new Date(),
    currentLocation: {
      page: initialPage,
      section: initialSection,
    },
  });

  const [activeUsers, setActiveUsers] = useState<PresenceData[]>([]);
  const [subscribers] = useState<Set<(users: PresenceData[]) => void>>(new Set());

  const lastActivityRef = useRef<number>(Date.now());
  const broadcastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Broadcast presence update
  const broadcastPresence = useCallback(
    (presenceData: PresenceData) => {
      if (wsClient.isConnected()) {
        wsClient.send({
          type: 'presence',
          payload: presenceData,
        }).catch((error) => {
          if (debug) {
            console.error('Failed to broadcast presence:', error);
          }
        });
      }
    },
    [wsClient, debug]
  );

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Reset away timer
    if (awayTimerRef.current) {
      clearTimeout(awayTimerRef.current);
    }

    // Set new away timer
    awayTimerRef.current = setTimeout(() => {
      setCurrentUser((prev) => {
        const updated = { ...prev, status: 'away' as const };
        broadcastPresence(updated);
        return updated;
      });
    }, awayTimeout);

    // Set status back to online if it was away
    setCurrentUser((prev) => {
      if (prev.status === 'away') {
        const updated = { ...prev, status: 'online' as const, lastSeen: new Date() };
        broadcastPresence(updated);
        return updated;
      }
      return prev;
    });
  }, [awayTimeout, broadcastPresence]);

  // Set status
  const setStatus = useCallback(
    (status: 'online' | 'away' | 'offline') => {
      setCurrentUser((prev) => {
        const updated = {
          ...prev,
          status,
          lastSeen: new Date(),
        };
        broadcastPresence(updated);
        return updated;
      });
    },
    [broadcastPresence]
  );

  // Set location
  const setLocation = useCallback(
    (page: string, section?: string) => {
      setCurrentUser((prev) => {
        const updated = {
          ...prev,
          currentLocation: { page, section },
          lastSeen: new Date(),
        };
        broadcastPresence(updated);
        return updated;
      });
      updateActivity();
    },
    [broadcastPresence, updateActivity]
  );

  // Set activity
  const setActivity = useCallback(
    (activity: string) => {
      setCurrentUser((prev) => {
        const updated = {
          ...prev,
          activity,
          lastSeen: new Date(),
        };
        broadcastPresence(updated);
        return updated;
      });
      updateActivity();
    },
    [broadcastPresence, updateActivity]
  );

  // Update mouse position
  const updateMousePosition = useCallback(
    (x: number, y: number) => {
      if (!trackMouse) return;

      // Throttle mouse updates
      if (mouseThrottleRef.current) return;

      mouseThrottleRef.current = setTimeout(() => {
        mouseThrottleRef.current = null;
      }, 100); // Update at most every 100ms

      setCurrentUser((prev) => {
        const updated = {
          ...prev,
          mousePosition: { x, y },
          lastSeen: new Date(),
        };
        broadcastPresence(updated);
        return updated;
      });
      updateActivity();
    },
    [trackMouse, broadcastPresence, updateActivity]
  );

  // Subscribe to presence updates
  const subscribe = useCallback(
    (callback: (users: PresenceData[]) => void) => {
      subscribers.add(callback);

      // Immediately call with current users
      callback(activeUsers);

      return () => {
        subscribers.delete(callback);
      };
    },
    [subscribers, activeUsers]
  );

  // Notify subscribers
  const notifySubscribers = useCallback(
    (users: PresenceData[]) => {
      subscribers.forEach((callback) => {
        try {
          callback(users);
        } catch (error) {
          if (debug) {
            console.error('Error in presence subscriber:', error);
          }
        }
      });
    },
    [subscribers, debug]
  );

  // Setup WebSocket listeners
  useEffect(() => {
    const unsubscribe = wsClient.on('message', (message: WebSocketMessage) => {
      if (message.type !== 'presence') return;

      const presenceData = message.payload as PresenceData;

      // Ignore own presence updates
      if (presenceData.userId === userId) return;

      setActiveUsers((prev) => {
        const existing = prev.find((u) => u.userId === presenceData.userId);

        let updated: PresenceData[];

        if (presenceData.status === 'offline') {
          // Remove user
          updated = prev.filter((u) => u.userId !== presenceData.userId);
        } else if (existing) {
          // Update existing user
          updated = prev.map((u) => (u.userId === presenceData.userId ? presenceData : u));
        } else {
          // Add new user
          updated = [...prev, presenceData];
        }

        notifySubscribers(updated);
        return updated;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [wsClient, userId, notifySubscribers]);

  // Subscribe to presence channel
  useEffect(() => {
    if (wsClient.isConnected()) {
      wsClient.subscribe('user-presence').catch((error) => {
        if (debug) {
          console.error('Failed to subscribe to presence:', error);
        }
      });
    }

    return () => {
      if (wsClient.isConnected()) {
        wsClient.unsubscribe('user-presence').catch((error) => {
          if (debug) {
            console.error('Failed to unsubscribe from presence:', error);
          }
        });
      }
    };
  }, [wsClient, debug]);

  // Periodic presence broadcast
  useEffect(() => {
    // Initial broadcast
    broadcastPresence(currentUser);

    // Setup periodic broadcast
    broadcastTimerRef.current = setInterval(() => {
      broadcastPresence(currentUser);
    }, broadcastInterval);

    return () => {
      if (broadcastTimerRef.current) {
        clearInterval(broadcastTimerRef.current);
      }
    };
  }, [currentUser, broadcastInterval, broadcastPresence]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Initial activity
    updateActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);

      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
      }
    };
  }, [updateActivity]);

  // Track mouse position
  useEffect(() => {
    if (!trackMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateMousePosition(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);

      if (mouseThrottleRef.current) {
        clearTimeout(mouseThrottleRef.current);
      }
    };
  }, [trackMouse, updateMousePosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Broadcast offline status
      setStatus('offline');
    };
  }, []);

  // Calculate counts
  const onlineCount = activeUsers.filter((u) => u.status === 'online').length + (currentUser.status === 'online' ? 1 : 0);
  const awayCount = activeUsers.filter((u) => u.status === 'away').length + (currentUser.status === 'away' ? 1 : 0);

  return {
    // Current user
    currentUser,
    status: currentUser.status,

    // Active users
    activeUsers,
    onlineCount,
    awayCount,

    // Methods
    setStatus,
    setLocation,
    setActivity,
    updateMousePosition,
    subscribe,
  };
}

/**
 * Hook for tracking presence in a specific room/page
 */
export function useRoomPresence(
  wsClient: WebSocketClient,
  userId: string,
  username: string,
  roomId: string,
  avatar?: string
): {
  usersInRoom: PresenceData[];
  userCount: number;
  setActivity: (activity: string) => void;
} {
  const [usersInRoom, setUsersInRoom] = useState<PresenceData[]>([]);

  const presence = usePresence({
    wsClient,
    userId,
    username,
    avatar,
    initialPage: roomId,
  });

  // Filter users in current room
  useEffect(() => {
    const filtered = presence.activeUsers.filter((u) => u.currentLocation.page === roomId);

    // Include current user if in the room
    if (presence.currentUser.currentLocation.page === roomId) {
      setUsersInRoom([presence.currentUser, ...filtered]);
    } else {
      setUsersInRoom(filtered);
    }
  }, [presence.activeUsers, presence.currentUser, roomId]);

  return {
    usersInRoom,
    userCount: usersInRoom.length,
    setActivity: presence.setActivity,
  };
}

/**
 * Hook for simple online/offline status
 */
export function useOnlineStatus(
  wsClient: WebSocketClient,
  userId: string,
  username: string
): {
  online: boolean;
  setOnline: (online: boolean) => void;
} {
  const presence = usePresence({
    wsClient,
    userId,
    username,
  });

  const setOnline = useCallback(
    (online: boolean) => {
      presence.setStatus(online ? 'online' : 'offline');
    },
    [presence]
  );

  return {
    online: presence.status === 'online',
    setOnline,
  };
}
