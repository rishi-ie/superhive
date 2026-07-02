/**
 * Terminal — xterm.js wrapper primitive.
 *
 * Renders a full PTY terminal in the browser using xterm.js + FitAddon.
 * Feeds incoming data via onData prop and accepts outgoing keystrokes via the
 * write function passed to onReady.
 *
 * Props:
 *   onData   — called when PTY emits output (renderer sends this to PTY via write)
 *   onReady  — called immediately with a TerminalHandle; parent stores it and
 *              calls write(data) to send user input to the PTY
 *   className — optional extra classes on the outer container
 *   theme     — optional xterm.js theme override (defaults to dark using CSS vars)
 */
import { useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { cn } from '@/lib/utils';
import 'xterm/css/xterm.css';

export type TerminalHandle = {
  write: (data: string) => void;
  clear: () => void;
  focus: () => void;
};

type TerminalProps = {
  onData: (data: string) => void;
  onReady: (handle: TerminalHandle) => void;
  className?: string;
  theme?: XTerm['options']['theme'];
};

export function Terminal({ onData, onReady, className, theme }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const writeRef = useRef<(data: string) => void>(() => {});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const handleData = useCallback(
    (data: string) => {
      writeRef.current(data);
    },
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      theme: theme ?? {
        background: '#151110',
        foreground: '#eae8e6',
        cursor: '#eae8e6',
        cursorAccent: '#151110',
        selectionBackground: 'rgba(5, 98, 239, 0.5)',
        black: '#1a1716',
        red: '#cc4444',
        green: '#50a878',
        yellow: '#d4a84b',
        blue: '#0562EF',
        magenta: '#7b68ee',
        cyan: '#50a878',
        white: '#eae8e6',
        brightBlack: '#a8a5a3',
        brightRed: '#ff6666',
        brightGreen: '#6fca9f',
        brightYellow: '#f0c060',
        brightBlue: '#3890ff',
        brightMagenta: '#a090ff',
        brightCyan: '#6fca9f',
        brightWhite: '#ffffff',
      },
      fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    writeRef.current = (data: string) => {
      term.write(data);
    };

    onReady({ write: handleData, clear: () => term.clear(), focus: () => term.focus() });

    term.onData((data) => {
      onData(data);
    });

    const ro = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {
        // ResizeObserver can fire after unmount
      }
    });
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => {
      ro.disconnect();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full overflow-hidden bg-[#151110]', className)}
      style={{ padding: '8px' } as CSSProperties}
    />
  );
}
