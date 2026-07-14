import { visit } from 'unist-util-visit'
import type { Node, Parent } from 'unist'

type TableText = { type: 'text'; value: string }
type TableEl = {
  type: 'element'
  tagName: string
  children: (TableEl | TableText)[]
}

function cellText(node: TableEl): string {
  return node.children
    .filter((n): n is TableText => n.type === 'text')
    .map((t) => t.value)
    .join('')
}

type Root = Parent & { children: Node[] }

export function serializeTableElementToMarkdown(root: Root): string {
  const rows: string[][] = []

  visit(root, 'element', (node) => {
    const el = node as unknown as TableEl
    if (el.tagName !== 'tr') return
    const cells: string[] = el.children
      .filter((n): n is TableEl => n.type === 'element' && (n.tagName === 'th' || n.tagName === 'td'))
      .map(cellText)
    rows.push(cells)
  })

  if (rows.length === 0) return ''
  const header = rows[0]!
  const colCount = header.length
  const separator = `| ${Array(colCount).fill('---').join(' | ')} |`
  return [
    `| ${header.join(' | ')} |`,
    separator,
    ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`),
  ].join('\n')
}

export function serializeTableElementToCsv(root: Root): string {
  const rows: string[][] = []

  visit(root, 'element', (node) => {
    const el = node as unknown as TableEl
    if (el.tagName !== 'tr') return
    const cells: string[] = el.children
      .filter((n): n is TableEl => n.type === 'element' && (n.tagName === 'th' || n.tagName === 'td'))
      .map(cellText)
    rows.push(cells)
  })

  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        })
        .join(','),
    )
    .join('\n')
}
