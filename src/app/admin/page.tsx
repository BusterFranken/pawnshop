export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Gem, Calendar } from "lucide-react";

export default async function AdminDashboardPage() {
  const [shopCount, appraisalCount, appointmentCount] = await Promise.all([
    db.shop.count(),
    db.appraisal.count(),
    db.appointment.count(),
  ]);

  const stats = [
    { label: "Total Shops", value: shopCount, icon: Store },
    { label: "Total Appraisals", value: appraisalCount, icon: Gem },
    { label: "Total Appointments", value: appointmentCount, icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
