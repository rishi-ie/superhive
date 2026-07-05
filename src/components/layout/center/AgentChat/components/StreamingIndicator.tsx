import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STATUSES = [
  "Thinking...",
  "Planning layout...",
  "Generating components...",
  "Writing code...",
];

export function StreamingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % STATUSES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      <span className="animate-pulse">{STATUSES[index]}</span>
    </div>
  );
}
