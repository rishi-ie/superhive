import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import migration0000 from '../../drizzle/0000_superb_valkyrie.sql?raw';
import migration0001 from '../../drizzle/0001_great_scalphunter.sql?raw';
import { log, logError, describePgError } from '@/lib/logger';

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
      log('db', 'wipe requested');
      await wipeDb();
      log('db', 'wipe done');
    } catch (err) {
      logError('db', 'wipe failed', err);
    }
    window.history.replaceState(null, '', window.location.pathname);
  }

  log('db', 'opening PGlite idb://superhive');
  _pglite = new PGlite('idb://superhive');
  _db = drizzle(_pglite, { schema });
  log('db', 'PGlite open, drizzle ready');

  const migrations: Array<[string, string]> = [
    ['0000', migration0000],
    ['0001', migration0001],
  ];

  for (const [name, sql] of migrations) {
    try {
      log('db', `applying migration ${name} (${sql.length} chars)`);
      await _pglite!.exec(sql);
      log('db', `migration ${name} ok`);
    } catch (err) {
      logError('db', `migration ${name} FAILED`, err);
      const desc = describePgError(err);
      log('db', 'pg error fields', desc);
      throw err;
    }
  }

  log('db', 'boot complete, DB ready');
}

export { schema };
