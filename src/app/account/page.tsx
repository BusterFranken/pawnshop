export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gem, Calendar, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAnonymousUserId } from "@/lib/anonymous-user";

export default async function AccountPage() {
  // Check both session (logged-in) and cookie (anonymous)
  const session = await auth();
  const anonymousUserId = await getAnonymousUserId();
  const userId = session?.user?.id || anonymousUserId;

  const recentAppraisals = userId
    ? await db.appraisal.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
          appointments: { include: { shop: true }, take: 1 },
        },
      })
    : [];

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    ANALYZING: "Analyzing",
    CONVERSING: "In Progress",
    APPRAISED: "Appraised",
    APPOINTMENT_BOOKED: "Booked",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Appraisals</h1>
        <Link href="/appraisal">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appraisal
          </Button>
        </Link>
      </div>

      {recentAppraisals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Gem className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="font-semibold text-lg">No appraisals yet</h2>
              <p className="text-muted-foreground">
                Upload a photo of your jewelry to get started.
              </p>
            </div>
            <Link href="/appraisal">
              <Button>Get Free Appraisal</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recentAppraisals.map((appraisal) => (
            <Link key={appraisal.id} href={`/appraisal/${appraisal.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {appraisal.images[0] && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={appraisal.images[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {appraisal.itemCategory || "Jewelry"}{" "}
                          {appraisal.metalType &&
                            `- ${appraisal.metalType.charAt(0) + appraisal.metalType.slice(1).toLowerCase()}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {STATUS_LABELS[appraisal.status]}
                        </Badge>
                      </div>
                      {appraisal.estimatedPayoutLow != null && (
                        <p className="text-sm font-semibold text-green-700 mt-1">
                          {formatCurrency(appraisal.estimatedPayoutLow)} &ndash;{" "}
                          {formatCurrency(appraisal.estimatedPayoutHigh!)}
                        </p>
                      )}
                      {appraisal.appointments[0] && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          Appointment at {appraisal.appointments[0].shop.name}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(appraisal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
