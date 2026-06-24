export type InlineElement =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'link'; value: string; href: string };

function parseInlines(text: string): InlineElement[] {
  const result: InlineElement[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Code span: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch && codeMatch[1] !== undefined) {
      result.push({ kind: 'code', value: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch[1] !== undefined) {
      result.push({ kind: 'bold', value: boldMatch[1] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch && italicMatch[1] !== undefined) {
      result.push({ kind: 'italic', value: italicMatch[1] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch[1] !== undefined && linkMatch[2] !== undefined) {
      result.push({ kind: 'link', value: linkMatch[1], href: linkMatch[2] });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Any other character
    const nextSpecial = remaining.search(/[`*\[`]/);
    if (nextSpecial === -1) {
      result.push({ kind: 'text', value: remaining });
      break;
    } else if (nextSpecial === 0) {
      result.push({ kind: 'text', value: remaining[0]! });
      remaining = remaining.slice(1);
    } else {
      result.push({ kind: 'text', value: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return result;
}

export type MarkdownBlock =
  | { kind: 'codeblock'; lang: string; code: string }
  | { kind: 'paragraph'; inlines: InlineElement[] };

export function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Code block: ```lang\ncode\n```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]?.startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i++;
      }
      blocks.push({ kind: 'codeblock', lang, code: codeLines.join('\n') });
      i++; // skip closing ```
      continue;
    }

    // List item: - text
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i]?.match(/^[-*]\s/)) {
        items.push((lines[i] ?? '').replace(/^[-*]\s/, ''));
        i++;
      }
      blocks.push({
        kind: 'paragraph',
        inlines: parseInlines(items.join(' ')),
      });
      continue;
    }

    // Heading: # text
    const headingMatch = line.match(/^(#+)\s(.+)/);
    if (headingMatch && headingMatch[2]) {
      blocks.push({
        kind: 'paragraph',
        inlines: [{ kind: 'bold', value: headingMatch[2] }],
      });
      i++;
      continue;
    }

    // Empty line — skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph — consume consecutive non-empty lines
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]?.trim() !== '' &&
      !lines[i]?.startsWith('```') &&
      !lines[i]?.match(/^[-*]\s/) &&
      !lines[i]?.startsWith('#')
    ) {
      paragraphLines.push(lines[i] ?? '');
      i++;
    }
    if (paragraphLines.length > 0) {
      blocks.push({
        kind: 'paragraph',
        inlines: parseInlines(paragraphLines.join(' ')),
      });
    }
  }

  return blocks;
}
