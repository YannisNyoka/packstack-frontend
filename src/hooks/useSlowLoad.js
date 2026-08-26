import { useEffect, useState } from 'react';

/**
 * The API can be a few seconds slow to respond right after being idle
 * (Render cold start) - a bare "Loading…" left up that whole time reads as
 * stuck. Returns true once `loading` has been true for longer than `delayMs`,
 * so callers can swap in a message that explains the wait instead.
 */
export function useSlowLoad(loading, delayMs = 3000) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [loading, delayMs]);

  return slow;
}
