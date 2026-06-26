/**
 * Code block with theme driven by settings.appearance.codeSyntaxTheme.
 */
import { type ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { Button } from '@/components/ui/Button';
import { STROKE_WIDTH } from '@/lib/constants';

type CodeBlockProps = {
  children?: ReactNode;
  code?: string;
  lang?: string;
  className?: string;
};

const CODE_THEMES: Record<string, { bg: string; text: string }> = {
  'github-dark': { bg: '#0d1117', text: '#e6edf3' },
  'github-light': { bg: '#f6f8fa', text: '#24292f' },
  monokai: { bg: '#272822', text: '#f8f8f2' },
  dracula: { bg: '#282a36', text: '#f8f8f2' },
  nord: { bg: '#2e3440', text: '#eceff4' },
  'solarized-dark': { bg: '#002b36', text: '#839496' },
};

export function CodeBlock({ children, code, lang = 'code', className }: CodeBlockProps) {
  const { settings } = useSettings();
  const theme = CODE_THEMES[settings.appearance.codeSyntaxTheme] ?? CODE_THEMES['github-dark']!;

  return (
    <div className={`my-2 rounded-md border border-border/40 overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-secondary/50">
        <span className="text-[9px] font-fustat uppercase tracking-wider text-muted-foreground/60">{lang}</span>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          onClick={() => navigator.clipboard.writeText(code ?? String(children ?? ''))}
        >
          <Copy size={10} strokeWidth={STROKE_WIDTH} />
          copy
        </Button>
      </div>
      <pre
        className="p-3 text-[11px] font-fustat overflow-x-auto leading-relaxed whitespace-pre-wrap"
        style={{ background: theme.bg, color: theme.text }}
      >
        <code>{code ?? children}</code>
      </pre>
    </div>
  );
}
