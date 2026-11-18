import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { schemaSql } from "@/lib/db/schema";

export type Row = Record<string, unknown>;
export type Sql = (text: string, params?: unknown[]) => Promise<Row[]>;

type Driver = {
  query: Sql;
  exec: (script: string) => Promise<void>;
  transaction: <T>(fn: (query: Sql) => Promise<T>) => Promise<T>;
};

const globalStore = globalThis as unknown as {
  castlineDriver?: Promise<Driver>;
  castlineReady?: Promise<void>;
};

const migrating = new AsyncLocalStorage<true>();

function databaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return url;
  throw new Error("DATABASE_URL must be a postgres connection string.");
}

async function openDriver(): Promise<Driver> {
  if (process.env.VERCEL && !databaseUrl()) {
    throw new Error(
      "DATABASE_URL is required on Vercel. Use the Supabase Postgres connection string.",
    );
  }
  const url = databaseUrl();
  if (url) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20 });
    return {
      query: async (text, params = []) => sql.unsafe(text, params as never[]),
      exec: async (script) => {
        await sql.unsafe(script);
      },
      transaction: (fn) =>
        sql.begin(async (trx) => fn(async (text, params = []) => trx.unsafe(text, params as never[]))),
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { NodeFS } = await import("@electric-sql/pglite/nodefs");
  const dir = path.join(process.cwd(), "data", "pglite");
  await mkdir(dir, { recursive: true });
  const db = new PGlite({ dataDir: dir, fs: new NodeFS(dir) });
  await db.waitReady;
  return {
    query: async (text, params = []) => (await db.query(text, params)).rows as Row[],
    exec: async (script) => {
      await db.exec(script);
    },
    transaction: (fn) =>
      db.transaction(async (tx) =>
        fn(async (text, params = []) => (await tx.query(text, params)).rows as Row[]),
      ),
  };
}

function driver() {
  globalStore.castlineDriver ??= openDriver();
  return globalStore.castlineDriver;
}

export function ready() {
  globalStore.castlineReady ??= migrate().catch((error: unknown) => {
    globalStore.castlineReady = undefined;
    throw error;
  });
  return globalStore.castlineReady;
}

async function migrate() {
  await migrating.run(true, async () => {
    const db = await driver();
    await db.exec(
      `create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())`,
    );
    const existing = await db.query(`select id from schema_migrations where id = $1`, ["0001_init"]);
    if (existing.length === 0) {
      await db.exec(schemaSql);
      await db.query(`insert into schema_migrations (id) values ($1)`, ["0001_init"]);
    }
    const { seedIfEmpty } = await import("@/lib/seed");
    await seedIfEmpty();
  });
}

async function usingDriver() {
  if (!migrating.getStore()) await ready();
  return driver();
}

export async function query<T extends Row = Row>(text: string, params: unknown[] = []) {
  const db = await usingDriver();
  return (await db.query(text, params)) as T[];
}

export async function one<T extends Row = Row>(text: string, params: unknown[] = []) {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (query: Sql) => Promise<T>) {
  const db = await usingDriver();
  return db.transaction(fn);
}

export async function todayIso() {
  const row = await one<{ today: string }>(`select to_char(current_date, 'YYYY-MM-DD') as today`);
  return row?.today ?? new Date().toISOString().slice(0, 10);
}
