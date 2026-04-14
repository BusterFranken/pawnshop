export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Pencil, MapPin } from "lucide-react";

export default async function AdminShopsPage() {
  const shops = await db.shop.findMany({
    orderBy: { name: "asc" },
    include: {
      owner: { select: { email: true, name: true } },
      _count: { select: { appointments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Shops</h1>
        <Link href="/admin/shops/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Shop
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {shops.map((shop) => (
          <Card key={shop.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{shop.name}</span>
                    <Badge variant={shop.isActive ? "default" : "secondary"}>
                      {shop.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {shop.city}, {shop.state}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Payout: {Math.round(shop.payoutFactor * 100)}%</span>
                    <span>Appointments: {shop._count.appointments}</span>
                    {shop.owner && (
                      <span>Owner: {shop.owner.name || shop.owner.email}</span>
                    )}
                  </div>
                </div>
                <Link href={`/admin/shops/${shop.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
