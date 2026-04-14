export const dynamic = "force-dynamic";

import { requireShopOwnerWithShop } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Gem } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NotificationPoller } from "./notification-poller";

export default async function DashboardOverviewPage() {
  const { shop } = await requireShopOwnerWithShop();

  const [unreadCount, recentNotifications, upcomingAppointments] =
    await Promise.all([
      db.notification.count({ where: { shopId: shop.id, read: false } }),
      db.notification.findMany({
        where: { shopId: shop.id },
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
        take: 10,
      }),
      db.appointment.findMany({
        where: {
          shopId: shop.id,
          scheduledAt: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: {
          appraisal: {
            select: { metalType: true, itemCategory: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <NotificationPoller />
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {upcomingAppointments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gem className="h-5 w-5" />
            Recent Appraisals Nearby
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No appraisals yet. You'll be notified when customers near you get
              appraised.
            </p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {notif.appraisal.itemCategory || "Jewelry"}{" "}
                        {notif.appraisal.metalType &&
                          `- ${notif.appraisal.metalType.charAt(0) + notif.appraisal.metalType.slice(1).toLowerCase()}`}
                      </span>
                      {!notif.read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    {notif.appraisal.estimatedPayoutLow != null && (
                      <p className="text-sm text-green-700">
                        {formatCurrency(notif.appraisal.estimatedPayoutLow)}{" "}
                        &ndash;{" "}
                        {formatCurrency(notif.appraisal.estimatedPayoutHigh!)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium capitalize">
                      {apt.appraisal.itemCategory || "Jewelry"}{" "}
                      {apt.appraisal.metalType &&
                        `- ${apt.appraisal.metalType.charAt(0) + apt.appraisal.metalType.slice(1).toLowerCase()}`}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs mr-2">
                        {apt.status}
                      </Badge>
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(apt.scheduledAt).toLocaleDateString()}{" "}
                    {new Date(apt.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
