import { requireAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import { Shield, Store, LayoutDashboard } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 border-r bg-muted/30 p-4 space-y-1 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="h-5 w-5 text-amber-600" />
          <span className="font-semibold">Admin</span>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/admin/shops"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <Store className="h-4 w-4" />
          Shops
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
