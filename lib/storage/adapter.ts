/**
 * lib/storage/adapter.ts
 *
 * Every module calls uploadFile() / getSignedUrl() / deleteFile() from here.
 * NOTHING outside this file calls Supabase Storage directly.
 *
 * Today: wraps Supabase Storage.
 * On AWS later: wraps S3 + CloudFront signed URLs, same function signatures.
 *
 * See 01-ARCHITECTURE-AND-PORTABILITY.md §3.
 */

import { getServiceDb } from "@/lib/db/client";

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER ?? "supabase";

function assertSupabaseProvider() {
  if (STORAGE_PROVIDER !== "supabase") {
    throw new Error(
      `STORAGE_PROVIDER="${STORAGE_PROVIDER}" is not implemented yet in lib/storage/adapter.ts.`,
    );
  }
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob | Buffer,
  options?: { contentType?: string; upsert?: boolean },
): Promise<{ path: string }> {
  assertSupabaseProvider();
  const db = getServiceDb();
  const { data, error } = await db.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });
  if (error) throw error;
  return { path: data.path };
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60 * 60,
): Promise<string> {
  assertSupabaseProvider();
  const db = getServiceDb();
  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  assertSupabaseProvider();
  const db = getServiceDb();
  const { error } = await db.storage.from(bucket).remove([path]);
  if (error) throw error;
}
