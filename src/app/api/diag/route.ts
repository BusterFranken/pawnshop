import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// TEMPORARY diagnostic endpoint — remove after debugging the DB connection.
// force-dynamic ensures this runs at request time (not prerendered at build).
export const dynamic = "force-dynamic";

function describe(e: unknown) {
  const err = e as { name?: string; code?: string; message?: string };
  return {
    ok: false,
    name: err?.name,
    code: err?.code,
    message: String(err?.message ?? e),
  };
}

export async function GET() {
  const result: Record<string, unknown> = {};

  try {
    result.connect = { ok: true, ping: await db.$queryRawUnsafe("SELECT 1 as ok") };
  } catch (e) {
    result.connect = describe(e);
  }

  try {
    result.shopCount = await db.shop.count();
  } catch (e) {
    result.shopQuery = describe(e);
  }

  try {
    result.migrations = await db.$queryRawUnsafe(
      'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at'
    );
  } catch (e) {
    result.migrations = describe(e);
  }

  return NextResponse.json(result);
}
