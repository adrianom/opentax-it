'use client';

import { useEffect, useState } from 'react';

function format(d: Date) {
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }).format(d);
}

/** Wall clock (hours and minutes, Europe/Rome), refreshed every minute. Rendered only on the client to avoid hydration mismatches. */
export function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <time className="font-mono text-sm tabular-nums text-muted-foreground" aria-label="Ora corrente">
      {time ?? '--:--'}
    </time>
  );
}
