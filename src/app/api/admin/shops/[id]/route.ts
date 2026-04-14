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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const shop = await db.shop.findUnique({
    where: { id },
    include: { owner: { select: { id: true, email: true, name: true } } },
  });

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  return NextResponse.json(shop);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = shopSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const shop = await db.shop.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(shop);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.shop.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
