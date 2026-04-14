import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account/login");
  }
  return session;
}

export async function requireShopOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    redirect("/account/login");
  }
  return session;
}

export async function requireShopOwnerWithShop() {
  const session = await requireShopOwner();
  const shop = await db.shop.findUnique({
    where: { ownerId: session.user.id },
  });
  if (!shop) {
    redirect("/account/login");
  }
  return { session, shop };
}
