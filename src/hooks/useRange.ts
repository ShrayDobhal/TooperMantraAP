'use client';
import { useCallback, useEffect, useState } from 'react';
import type { RangeKey } from '@/lib/format';

const KEY = 'tm_range';

/** Selected analytics range, remembered across pages for this browser. */
export function useRange(initial: RangeKey = '7d'): [RangeKey, (r: RangeKey) => void] {
  const [range, setRangeState] = useState<RangeKey>(initial);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY) as RangeKey | null;
      if (saved && ['today', '7d', '30d', '90d'].includes(saved)) setRangeState(saved);
    } catch {
      // Storage unavailable: keep the default.
    }
  }, []);
  const setRange = useCallback((r: RangeKey) => {
    setRangeState(r);
    try {
      window.localStorage.setItem(KEY, r);
    } catch {
      // ignore
    }
  }, []);
  return [range, setRange];
}
