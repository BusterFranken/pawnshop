import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const shop = await db.shop.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!shop) {
    return NextResponse.json({ error: "No shop linked" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const notifications = await db.notification.findMany({
    where: {
      shopId: shop.id,
      ...(unreadOnly ? { read: false } : {}),
    },
    include: {
      appraisal: {
        select: {
          id: true,
          metalType: true,
          itemCategory: true,
          estimatedPayoutLow: true,
          estimatedPayoutHigh: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await db.notification.count({
    where: { shopId: shop.id, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
