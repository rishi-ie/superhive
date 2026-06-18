import { useEffect, useRef } from 'react';

type UseDoubleClickOptions = {
  onDoubleClick: (e: React.MouseEvent) => void;
  delay?: number;
  enabled?: boolean;
};

export function useDoubleClick({ onDoubleClick, delay = 250, enabled = true }: UseDoubleClickOptions) {
  const lastClickRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!enabled) return;

    const now = Date.now();
    const last = lastClickRef.current;

    if (
      last &&
      now - last.time < delay &&
      Math.abs(e.clientX - last.x) < 5 &&
      Math.abs(e.clientY - last.y) < 5
    ) {
      onDoubleClick(e);
      lastClickRef.current = null;
    } else {
      lastClickRef.current = { time: now, x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    return () => {
      lastClickRef.current = null;
    };
  }, []);

  return { onClick: handleClick };
}
