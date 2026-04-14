import { requireShopOwnerWithShop } from "@/lib/auth-helpers";
import Link from "next/link";
import { Store, Bell, Gem, Calendar } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { shop } = await requireShopOwnerWithShop();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 border-r bg-muted/30 p-4 space-y-1 shrink-0">
        <div className="px-3 py-2 mb-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-sm truncate">{shop.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {shop.city}, {shop.state}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <Bell className="h-4 w-4" />
          Overview
        </Link>
        <Link
          href="/dashboard/appraisals"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <Gem className="h-4 w-4" />
          Appraisals
        </Link>
        <Link
          href="/dashboard/appointments"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Appointments
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
