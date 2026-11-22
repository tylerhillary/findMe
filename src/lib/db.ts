import "server-only";
import path from "node:path";
import fs from "node:fs";
import { seed } from "./seed";

// node:sqlite ships with Node 22+. Loading it through getBuiltinModule keeps
// the bundler from trying to resolve it.
type Row = Record<string, unknown>;
export interface Statement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): Row | undefined;
  all(...params: unknown[]): Row[];
}
export interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
}

type SqliteModule = { DatabaseSync: new (file: string) => Database };

const globalForDb = globalThis as unknown as { __findinDb?: Database };

function open(): Database {
  const getBuiltin = (process as unknown as { getBuiltinModule: (id: string) => unknown })
    .getBuiltinModule;
  const { DatabaseSync } = getBuiltin("node:sqlite") as SqliteModule;

  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "findin.db"));

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      headline TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      hourly_rate INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1,
      avatar TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'Intermediate'
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      price_unit TEXT NOT NULL DEFAULT 'project',
      delivery_days INTEGER NOT NULL DEFAULT 3,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      budget INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
    CREATE INDEX IF NOT EXISTS idx_requests_client ON requests(client_id);
    CREATE INDEX IF NOT EXISTS idx_requests_provider ON requests(provider_id);
    CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);
  `);

  const plainDb = withPlainRows(db);
  const count = plainDb.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (count.n === 0) seed(plainDb);
  return plainDb;
}

// node:sqlite returns rows with a null prototype, which React refuses to pass
// to Client Components. Copy them into ordinary objects.
function withPlainRows(db: Database): Database {
  return {
    exec: (sql) => db.exec(sql),
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        run: (...p) => stmt.run(...p),
        get: (...p) => {
          const row = stmt.get(...p);
          return row ? { ...row } : undefined;
        },
        all: (...p) => stmt.all(...p).map((r) => ({ ...r })),
      };
    },
  };
}

export function getDb(): Database {
  if (!globalForDb.__findinDb) globalForDb.__findinDb = open();
  return globalForDb.__findinDb;
}

export function tx<T>(fn: (db: Database) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const out = fn(db);
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
