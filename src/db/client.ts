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

async function boot() {
  _pglite = new PGlite('idb://superhive');
  _db = drizzle(_pglite, { schema });

  // Apply migrations: drizzle-kit generates SQL in drizzle/*.sql.
  // We import them as raw strings for Vite to bundle.
  await _pglite.exec(migration0000);
  await _pglite.exec(migration0001);
}

export { schema };
