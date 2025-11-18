'use client';

import { useMemo } from 'react';

export function useUserPlan() {
  const tier = 'free';

  const usage = useMemo(() => ({
    orderPercent: 0.85,
    storagePercent: 0.4,
  }), []);

  return { tier, usage };
}
