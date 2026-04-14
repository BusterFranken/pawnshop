import { db } from "@/lib/db";

export async function notifyNearbyShops(appraisalId: string) {
  const appraisal = await db.appraisal.findUnique({
    where: { id: appraisalId },
  });
  if (!appraisal) return;

  // For MVP: notify all active shops with an owner
  // Future: filter by haversine distance from user's location
  const shops = await db.shop.findMany({
    where: { isActive: true, ownerId: { not: null } },
    select: { id: true },
  });

  if (shops.length === 0) return;

  await db.notification.createMany({
    data: shops.map((shop) => ({
      shopId: shop.id,
      appraisalId,
      type: "NEW_APPRAISAL",
    })),
  });
}
