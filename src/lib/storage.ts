import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function bucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "creatives";
}

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function storageMode() {
  return supabase() ? "supabase" : "local";
}

export async function putObject(key: string, bytes: Uint8Array, contentType: string) {
  const safe = assertKey(key);
  const client = supabase();
  if (client) {
    const { error } = await client.storage.from(bucket()).upload(safe, Buffer.from(bytes), {
      contentType,
      upsert: false,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return;
  }
  const full = localPath(safe);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function getObject(key: string) {
  const safe = assertKey(key);
  const client = supabase();
  if (client) {
    const { data, error } = await client.storage.from(bucket()).download(safe);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  }
  try {
    return new Uint8Array(await readFile(localPath(safe)));
  } catch {
    return null;
  }
}

function assertKey(key: string) {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw new Error("Invalid storage key.");
  }
  return key;
}

function localPath(key: string) {
  const root = path.resolve(process.cwd(), "data", "uploads");
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage key.");
  }
  return full;
}
