'use client';

import { useEffect, useState } from 'react';
import { formatLocalDateTime, formatTimeAgo, getLocalTimezoneCode } from '@/lib/format';

export function FormattedDateTime({
  date,
  includeTime = true,
  includeTimezone = true,
  relative = false,
  className = '',
}: {
  date: Date | string | number | null | undefined;
  includeTime?: boolean;
  includeTimezone?: boolean;
  relative?: boolean;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!date) return <span className={className}>—</span>;

  if (!mounted) {
    const raw = typeof date === 'string' ? date : date instanceof Date ? date.toISOString() : String(date);
    return <span className={className}>{raw.slice(0, 19).replace('T', ' ')}</span>;
  }

  if (relative) {
    const timeAgo = formatTimeAgo(date);
    const fullLocal = formatLocalDateTime(date, { includeTime, includeTimezone });
    return (
      <span className={className} title={fullLocal}>
        {timeAgo}
      </span>
    );
  }

  const formatted = formatLocalDateTime(date, { includeTime, includeTimezone });
  return <span className={className}>{formatted}</span>;
}

export function LocalTimezoneBadge({ className = '' }: { className?: string }) {
  const [tz, setTz] = useState('UTC');

  useEffect(() => {
    setTz(getLocalTimezoneCode());
  }, []);

  return (
    <span
      className={`inline-flex items-center rounded-md bg-purple-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20 ${className}`}
      title="User Local Time Zone"
    >
      {tz}
    </span>
  );
}
