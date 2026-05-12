import { createClient, Client, InValue } from '@libsql/client';

let _client: Client | null = null;

export function getClient(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL environment variable is not set');
    _client = createClient({ url, authToken });
  }
  return _client;
}

// ── Schema initialisation (idempotent) ───────────────────────────────────────
let schemaReady = false;

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  schemaReady = true;
  const db = getClient();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      duration_days INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      topic TEXT DEFAULT '',
      day INTEGER NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      priority TEXT DEFAULT 'medium',
      notes TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT DEFAULT '',
      size INTEGER DEFAULT 0,
      content TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );
  `);
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  await ensureSchema();
  const result = await getClient().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T | undefined> {
  const rows = await dbAll<T>(sql, args);
  return rows[0];
}

export async function dbRun(
  sql: string,
  args: InValue[] = [],
) {
  await ensureSchema();
  return getClient().execute({ sql, args });
}

// For raw multi-statement SQL (schema migrations etc.)
export async function dbExec(sql: string) {
  return getClient().executeMultiple(sql);
}
