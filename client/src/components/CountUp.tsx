import { useEffect, useState } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** If provided, formats the animated number (e.g. for currency). Value is in same units as props.value. */
  format?: (value: number) => string;
  className?: string;
}

export default function CountUp({
  value,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  format: formatFn,
  className = '',
}: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - (1 - progress) ** 2;
      const current = value * easeOut;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
    };

    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const formatted = formatFn
    ? formatFn(display)
    : (decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString());

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
