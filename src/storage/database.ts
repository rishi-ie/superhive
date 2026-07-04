import { JSONFilePreset } from 'lowdb/node'

let userDataPath: string | null = null

export function setUserDataPath(path: string): void {
  userDataPath = path
}

export async function loadDb<T>(filename: string, defaults: T) {
  if (!userDataPath) {
    throw new Error('User data path not set. Call setUserDataPath() first.')
  }
  return JSONFilePreset<T>(userDataPath + '/' + filename, defaults)
}
