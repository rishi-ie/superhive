import {
  closeSync,
  existsSync,
  openSync,
  readSync,
  statSync,
  watch,
  type FSWatcher,
} from 'node:fs'
import { dirname } from 'node:path'
import log from 'electron-log/main'

const POLL_INTERVAL_MS = 500
const POLL_TIMEOUT_MS = 30_000

export class TelemetryTailer {
  private watcher: FSWatcher | null = null
  private offset = 0
  private lineBuffer = ''
  private debounceTimer: NodeJS.Timeout | null = null
  private lineCount = 0
  private pollTimer: NodeJS.Timeout | null = null
  private pollStartedAt = 0

  constructor(
    private readonly journalPath: string,
    private readonly onEvent: (event: unknown) => void,
  ) {}

  start(): void {
    if (existsSync(this.journalPath)) {
      this.watchFile()
      return
    }
    this.watchDir()
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }

  private watchFile(): void {
    try {
      this.watcher = watch(this.journalPath, () => this.scheduleRead())
    } catch (err) {
      // node:fs.watch on a missing or unwritable file throws ENOENT.
      // That surfaces as the file appearing later than the watch call,
      // which is exactly the case the dir + poll fallback exists for.
      log.warn(`[telemetry-tailer] watch failed for ${this.journalPath}; switching to dir+poll:`, err)
      this.watchDir()
      return
    }
    log.debug(`[telemetry-tailer] watching ${this.journalPath}`)
    this.scheduleRead()
  }

  private watchDir(): void {
    const dir = dirname(this.journalPath)
    let dirWatchFailed = false
    try {
      this.watcher = watch(dir, () => this.promoteIfFileExists())
    } catch (err) {
      log.warn(`[telemetry-tailer] dir watch failed for ${dir}; relying on poll only:`, err)
      // No watcher attached — poll fallback will carry the load.
      this.watcher = null
      dirWatchFailed = true
    }
    if (!dirWatchFailed) {
      log.debug(`[telemetry-tailer] journal missing; watching parent dir ${dir} for it to appear`)
    }
    // Always arm the poll. macOS kqueue directory watches coalesce
    // create-then-write sequences and can miss the journal's first
    // appearance entirely; the poll is the bulletproof fallback.
    this.startPoll()
  }

  private startPoll(): void {
    if (this.pollTimer) return
    this.pollStartedAt = Date.now()
    const tick = () => {
      if (!this.pollTimer) return
      if (existsSync(this.journalPath)) {
        log.debug(`[telemetry-tailer] journal appeared at ${this.journalPath} (poll found it)`)
        this.stopPoll()
        this.promoteIfFileExists()
        return
      }
      if (Date.now() - this.pollStartedAt >= POLL_TIMEOUT_MS) {
        log.warn(
          `[telemetry-tailer] poll timed out after ${POLL_TIMEOUT_MS}ms — journal never appeared at ${this.journalPath}`,
        )
        this.stopPoll()
        return
      }
      this.pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
    }
    this.pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
  }

  private stopPoll(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
  }

  private promoteIfFileExists(): void {
    if (!existsSync(this.journalPath)) return
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    log.debug(`[telemetry-tailer] journal appeared at ${this.journalPath}; promoting to file watch`)
    this.watchFile()
  }

  private scheduleRead(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      this.readNew()
    }, 30)
  }

  /**
   * Drop the file watcher and switch to the dir-watch + poll fallback.
   * Used when the file disappears (e.g. the rename half of a rotation
   * lands before the recreate half) so we don't miss the next event.
   */
  private fallbackToDirWatch(reason: string): void {
    if (this.watcher) {
      try {
        this.watcher.close()
      } catch {
        /* ignore */
      }
      this.watcher = null
    }
    log.debug(`[telemetry-tailer] file gone (${reason}); switching to dir+poll`)
    this.watchDir()
  }

  private readNew(): void {
    // Rotation handling: the telemetry extension rotates telemetry.jsonl
    // on every session_start (rename to .1, then create a new empty file
    // at the original path). After the rename the watcher is bound to
    // the rotated-away inode — writes to the new file go unseen until
    // the watcher is re-armed on the current path. A truncated read is
    // the only signal that a rotation just happened.
    if (!existsSync(this.journalPath)) {
      this.fallbackToDirWatch('missing between rename and recreate')
      return
    }
    let size: number
    try {
      size = statSync(this.journalPath).size
    } catch {
      return
    }
    if (size < this.offset) {
      log.debug(
        `[telemetry-tailer] journal truncated (size=${size} < offset=${this.offset}); resetting + re-arming watcher`,
      )
      this.offset = 0
      this.lineBuffer = ''
      // Close the existing watcher (bound to the rotated inode) and
      // re-establish on the current path. Schedule an immediate read
      // so the tail of the new file is consumed right away.
      if (this.watcher) {
        try {
          this.watcher.close()
        } catch {
          /* ignore */
        }
        this.watcher = null
      }
      try {
        this.watcher = watch(this.journalPath, () => this.scheduleRead())
        this.scheduleRead()
      } catch (err) {
        log.warn(
          `[telemetry-tailer] watch re-arm failed for ${this.journalPath}; switching to dir+poll:`,
          err,
        )
        this.watcher = null
        this.watchDir()
      }
      return
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
