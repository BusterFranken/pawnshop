export const dynamic = "force-dynamic";

import { requireShopOwnerWithShop } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardAppraisalsPage() {
  const { shop } = await requireShopOwnerWithShop();

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nearby Appraisals</h1>
      <p className="text-muted-foreground">
        These are completed appraisals from potential customers.
      </p>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No appraisals yet. You'll see them here when customers near you get
            appraised.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {notif.appraisal.images[0] && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={notif.appraisal.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {notif.appraisal.itemCategory || "Jewelry"}{" "}
                        {notif.appraisal.metalType &&
                          `- ${notif.appraisal.metalType.charAt(0) + notif.appraisal.metalType.slice(1).toLowerCase()}`}
                      </span>
                      {!notif.read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {notif.appraisal.status}
                      </Badge>
                    </div>
                    {notif.appraisal.estimatedPayoutLow != null && (
                      <p className="text-sm font-semibold text-green-700 mt-1">
                        {formatCurrency(notif.appraisal.estimatedPayoutLow)}{" "}
                        &ndash;{" "}
                        {formatCurrency(notif.appraisal.estimatedPayoutHigh!)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.appraisal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
