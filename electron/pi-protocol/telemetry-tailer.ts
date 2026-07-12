import { closeSync, existsSync, openSync, readSync, statSync, watch, type FSWatcher } from 'node:fs'
import log from 'electron-log/main'

export class TelemetryTailer {
  private watcher: FSWatcher | null = null
  private offset = 0
  private lineBuffer = ''
  private debounceTimer: NodeJS.Timeout | null = null
  private lineCount = 0

  constructor(
    private readonly journalPath: string,
    private readonly onEvent: (event: unknown) => void,
  ) {}

  start(): void {
    if (!existsSync(this.journalPath)) {
      log.debug(`[telemetry-tailer] no journal yet at ${this.journalPath}; will tail when file appears`)
    }
    try {
      this.watcher = watch(this.journalPath, () => this.scheduleRead())
    } catch (err) {
      log.warn(`[telemetry-tailer] failed to watch ${this.journalPath}:`, err)
      return
    }
    this.scheduleRead()
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }

  private scheduleRead(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      this.readNew()
    }, 30)
  }

  private readNew(): void {
    if (!existsSync(this.journalPath)) return
    let size: number
    try {
      size = statSync(this.journalPath).size
    } catch {
      return
    }
    if (size < this.offset) {
      log.debug(`[telemetry-tailer] journal truncated (size=${size} < offset=${this.offset}); resetting`)
      this.offset = 0
      this.lineBuffer = ''
    }
    if (size <= this.offset) return

    let fd: number
    try {
      fd = openSync(this.journalPath, 'r')
    } catch (err) {
      log.warn(`[telemetry-tailer] open failed for ${this.journalPath}:`, err)
      return
    }

    try {
      const length = size - this.offset
      const buf = Buffer.alloc(length)
      readSync(fd, buf, 0, length, this.offset)
      this.lineBuffer += buf.toString('utf8')
      this.offset = size

      let nlIdx: number
      while ((nlIdx = this.lineBuffer.indexOf('\n')) !== -1) {
        const line = this.lineBuffer.slice(0, nlIdx).replace(/\r$/, '')
        this.lineBuffer = this.lineBuffer.slice(nlIdx + 1)
        if (!line) continue
        try {
          const event = JSON.parse(line) as { type?: unknown; [k: string]: unknown }
          if (event && typeof event === 'object' && typeof event.type === 'string') {
            this.onEvent(event)
            this.lineCount++
          }
        } catch (err) {
          log.warn(`[telemetry-tailer] malformed line at ${this.journalPath}:${this.lineCount}:`, err)
        }
      }
    } catch (err) {
      log.warn(`[telemetry-tailer] read failed for ${this.journalPath}:`, err)
    } finally {
      closeSync(fd)
    }
  }
}
