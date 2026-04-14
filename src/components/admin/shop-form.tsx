"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ShopData {
  id?: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website: string;
  description: string;
  acceptsGold: boolean;
  acceptsSilver: boolean;
  acceptsPlatinum: boolean;
  payoutFactor: number;
  isActive: boolean;
}

const defaultShop: ShopData = {
  name: "",
  slug: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  latitude: 0,
  longitude: 0,
  phone: "",
  email: "",
  website: "",
  description: "",
  acceptsGold: true,
  acceptsSilver: true,
  acceptsPlatinum: false,
  payoutFactor: 0.6,
  isActive: true,
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ShopForm({ shop }: { shop?: ShopData }) {
  const router = useRouter();
  const isEdit = !!shop?.id;
  const [form, setForm] = useState<ShopData>(shop ?? defaultShop);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: keyof ShopData, value: string | number | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !isEdit) {
        next.slug = toSlug(value as string);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = isEdit
      ? `/api/admin/shops/${shop!.id}`
      : "/api/admin/shops";

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        payoutFactor: Number(form.payoutFactor),
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        description: form.description || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin/shops");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Address *</label>
            <Input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">City *</label>
              <Input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">State *</label>
              <Input
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Zip Code *</label>
              <Input
                value={form.zipCode}
                onChange={(e) => update("zipCode", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Latitude *</label>
              <Input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Longitude *</label>
              <Input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Website</label>
            <Input
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Payout Factor ({Math.round(Number(form.payoutFactor) * 100)}% of melt value)
            </label>
            <Input
              type="range"
              min="0.3"
              max="0.9"
              step="0.01"
              value={form.payoutFactor}
              onChange={(e) => update("payoutFactor", e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.acceptsGold}
                onChange={(e) => update("acceptsGold", e.target.checked)}
              />
              Accepts Gold
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.acceptsSilver}
                onChange={(e) => update("acceptsSilver", e.target.checked)}
              />
              Accepts Silver
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.acceptsPlatinum}
                onChange={(e) => update("acceptsPlatinum", e.target.checked)}
              />
              Accepts Platinum
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
            />
            Active (visible to users)
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update Shop" : "Create Shop"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/shops")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
