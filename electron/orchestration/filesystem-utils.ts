import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`
  await writeFile(temp, JSON.stringify(value, null, '\t') + '\n', 'utf8')
  await rename(temp, path)
}

