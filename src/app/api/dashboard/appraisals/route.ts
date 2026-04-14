import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
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

  // Get appraisals that triggered notifications for this shop
  const notifications = await db.notification.findMany({
    where: { shopId: shop.id },
    include: {
      appraisal: {
        select: {
          id: true,
          metalType: true,
          itemCategory: true,
          estimatedPayoutLow: true,
          estimatedPayoutHigh: true,
          status: true,
          createdAt: true,
          images: { take: 1, orderBy: { order: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const appraisals = notifications.map((n) => ({
    ...n.appraisal,
    notificationId: n.id,
    notificationRead: n.read,
  }));

  return NextResponse.json({ appraisals });
}
