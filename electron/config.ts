import { config as loadDotenv } from 'dotenv'
import { join } from 'node:path'
import { app } from 'electron'

const appPath = app?.getAppPath() ?? process.cwd()
loadDotenv({ path: join(appPath, '.env') })
loadDotenv({ path: join(appPath, '.env.local'), override: true })

export const config = {
  get minimaxApiKey(): string {
    const key = process.env.MINIMAX_API_KEY
    if (!key?.trim()) {
      throw new Error(
        'MINIMAX_API_KEY is not set. Add it to .env.local (see .env.example).'
      )
    }
    return key
  },
}
