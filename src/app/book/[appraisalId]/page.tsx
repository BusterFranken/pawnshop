"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Star, Clock, DollarSign, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Shop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  rating: number | null;
  payoutFactor: number;
  distance: number;
  hours: Record<string, { open: string; close: string }> | null;
  acceptsGold: boolean;
  acceptsSilver: boolean;
  acceptsPlatinum: boolean;
}

interface Appraisal {
  id: string;
  metalType: string | null;
  estimatedPayoutLow: number | null;
  estimatedPayoutHigh: number | null;
  itemCategory: string | null;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load appraisal
      const apprRes = await fetch(`/api/appraisal/${params.appraisalId}`);
      if (apprRes.ok) {
        setAppraisal(await apprRes.json());
      }

      // Get user location and load shops
      let lat = 40.7128, lng = -74.006; // Default: NYC
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Use default
      }

      const shopsRes = await fetch(`/api/shops?lat=${lat}&lng=${lng}&radius=100`);
      if (shopsRes.ok) {
        const data = await shopsRes.json();
        setShops(data.shops);
      }

      setLoading(false);
    }
    load();
  }, [params.appraisalId]);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  ];

  async function handleBook() {
    if (!selectedShop || !selectedDate || !selectedTime) return;

    const scheduledAt = `${selectedDate}T${selectedTime}:00`;
    const res = await fetch("/api/appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appraisalId: params.appraisalId,
        shopId: selectedShop,
        scheduledAt,
        notes: notes.trim() || undefined,
      }),
    });

    if (res.ok) {
      setBooked(true);
    }
  }

  if (booked) {
    const shop = shops.find((s) => s.id === selectedShop);
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Appointment Booked!</h1>
        <p className="text-muted-foreground">
          Your appointment at <strong>{shop?.name}</strong> is confirmed for{" "}
          <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Bring your jewelry item for a professional in-person evaluation.
        </p>
        <Button onClick={() => router.push("/")} variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading nearby shops...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Book an Appointment</h1>
          {appraisal && appraisal.estimatedPayoutLow != null && (
            <p className="text-muted-foreground mt-1">
              Estimated value:{" "}
              <span className="font-semibold text-green-700">
                {formatCurrency(appraisal.estimatedPayoutLow)} &ndash;{" "}
                {formatCurrency(appraisal.estimatedPayoutHigh!)}
              </span>
              {appraisal.itemCategory && (
                <span> for your {appraisal.itemCategory}</span>
              )}
            </p>
          )}
        </div>

        {/* Shop list */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Nearby Pawn Shops</h2>
          {shops.length === 0 ? (
            <p className="text-muted-foreground">No shops found nearby. Try expanding your search radius.</p>
          ) : (
            <div className="grid gap-4">
              {shops.map((shop) => (
                <Card
                  key={shop.id}
                  className={`cursor-pointer transition-colors ${
                    selectedShop === shop.id
                      ? "ring-2 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedShop(shop.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{shop.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {shop.address}, {shop.city}, {shop.state}
                        </div>
                        {shop.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {shop.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {shop.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {shop.rating.toFixed(1)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            Pays ~{Math.round(shop.payoutFactor * 100)}% of melt
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {shop.distance.toFixed(1)} mi
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Booking form */}
        {selectedShop && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Select Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                {selectedDate && (
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything the shop should know..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleBook}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full"
                  size="lg"
                >
                  Confirm Appointment
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
