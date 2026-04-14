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

  const appointments = await db.appointment.findMany({
    where: { shopId: shop.id },
    include: {
      appraisal: {
        select: {
          id: true,
          metalType: true,
          itemCategory: true,
          estimatedPayoutLow: true,
          estimatedPayoutHigh: true,
        },
      },
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ appointments });
}
