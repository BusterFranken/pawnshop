export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShopForm } from "@/components/admin/shop-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditShopPage({ params }: Props) {
  const { id } = await params;

  const shop = await db.shop.findUnique({ where: { id } });
  if (!shop) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit: {shop.name}</h1>
      <ShopForm
        shop={{
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          address: shop.address,
          city: shop.city,
          state: shop.state,
          zipCode: shop.zipCode,
          latitude: shop.latitude,
          longitude: shop.longitude,
          phone: shop.phone ?? "",
          email: shop.email ?? "",
          website: shop.website ?? "",
          description: shop.description ?? "",
          acceptsGold: shop.acceptsGold,
          acceptsSilver: shop.acceptsSilver,
          acceptsPlatinum: shop.acceptsPlatinum,
          payoutFactor: shop.payoutFactor,
          isActive: shop.isActive,
        }}
      />
    </div>
  );
}
