import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shopSchema } from "@/lib/validators/shop";

async function requireAdminApi() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const shops = await db.shop.findMany({
    orderBy: { name: "asc" },
    include: { owner: { select: { id: true, email: true, name: true } } },
  });

  return NextResponse.json({ shops });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = shopSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const shop = await db.shop.create({ data: parsed.data });
  return NextResponse.json(shop, { status: 201 });
}
