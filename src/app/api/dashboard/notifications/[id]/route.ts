import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const notification = await db.notification.findUnique({
    where: { id },
    include: { shop: { select: { ownerId: true } } },
  });

  if (!notification || notification.shop.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
