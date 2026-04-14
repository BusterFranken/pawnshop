export const dynamic = "force-dynamic";

import { requireShopOwnerWithShop } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default async function DashboardAppointmentsPage() {
  const { shop } = await requireShopOwnerWithShop();

  const appointments = await db.appointment.findMany({
    where: { shopId: shop.id },
    include: {
      appraisal: {
        select: {
          metalType: true,
          itemCategory: true,
          estimatedPayoutLow: true,
          estimatedPayoutHigh: true,
        },
      },
      user: { select: { name: true, phone: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 50,
  });

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    CONFIRMED: "default",
    CANCELLED: "destructive",
    COMPLETED: "secondary",
    NO_SHOW: "destructive",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appointments</h1>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No appointments yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(apt.scheduledAt).toLocaleDateString()} at{" "}
                        {new Date(apt.scheduledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Badge variant={statusColors[apt.status] ?? "outline"}>
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {apt.appraisal.itemCategory || "Jewelry"}{" "}
                      {apt.appraisal.metalType &&
                        `- ${apt.appraisal.metalType.charAt(0) + apt.appraisal.metalType.slice(1).toLowerCase()}`}
                    </p>
                    {apt.appraisal.estimatedPayoutLow != null && (
                      <p className="text-sm text-green-700">
                        {formatCurrency(apt.appraisal.estimatedPayoutLow)}{" "}
                        &ndash;{" "}
                        {formatCurrency(apt.appraisal.estimatedPayoutHigh!)}
                      </p>
                    )}
                    {apt.user.name && (
                      <p className="text-xs text-muted-foreground">
                        Customer: {apt.user.name}
                        {apt.user.phone && ` | ${apt.user.phone}`}
                      </p>
                    )}
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        &ldquo;{apt.notes}&rdquo;
                      </p>
                    )}
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
