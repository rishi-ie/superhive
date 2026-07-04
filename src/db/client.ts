import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import migrationsSql from '../../drizzle/0000_superb_valkyrie.sql?raw';

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
  // We import it as a raw string for Vite to bundle.
  await _pglite.exec(migrationsSql);
}

export { schema };
