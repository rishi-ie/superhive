import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import migration0000 from '../../drizzle/0000_superb_valkyrie.sql?raw';
import migration0001 from '../../drizzle/0001_great_scalphunter.sql?raw';

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _pglite: PGlite | null = null;
let _db: Db | null = null;
let _ready: Promise<void> | null = null;

export async function getDb(): Promise<Db> {
  if (_db) return _db;
  if (!_ready) _ready = boot();
  await _ready;
  if (!_db) throw new Error('DB failed to initialize');
  return _db;
}

export async function wipeDb(): Promise<void> {
  if (_pglite) {
    try {
      await _pglite.close();
    } catch {
      // ignore
    }
    _pglite = null;
    _db = null;
    _ready = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('superhive');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(
        new Error(
          'IDB delete blocked — close all other tabs of this app and retry'
        )
      );
  });
}

async function boot() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('wipe') === '1') {
    try {
      await wipeDb();
    } catch (err) {
      console.error('[db] wipe failed:', err);
    }
    window.history.replaceState(null, '', window.location.pathname);
  }

  _pglite = new PGlite('idb://superhive');
  _db = drizzle(_pglite, { schema });

  try {
    await _pglite.exec(migration0000);
    await _pglite.exec(migration0001);
  } catch (err) {
    console.error('[db] migration failed:', err);
    throw err;
  }
}

export { schema };
