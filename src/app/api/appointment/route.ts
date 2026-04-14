import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAnonymousUserId } from "@/lib/anonymous-user";

export async function POST(req: NextRequest) {
  const { appraisalId, shopId, scheduledAt, notes } = await req.json();

  if (!appraisalId || !shopId || !scheduledAt) {
    return NextResponse.json(
      { error: "appraisalId, shopId, and scheduledAt are required" },
      { status: 400 }
    );
  }

  const userId = await getAnonymousUserId();
  if (!userId) {
    return NextResponse.json({ error: "No session found" }, { status: 401 });
  }

  const appraisal = await db.appraisal.findUnique({
    where: { id: appraisalId, userId },
  });

  if (!appraisal) {
    return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
  }

  const appointment = await db.appointment.create({
    data: {
      userId,
      appraisalId,
      shopId,
      scheduledAt: new Date(scheduledAt),
      notes: notes || null,
      status: "PENDING",
    },
    include: { shop: true },
  });

  await db.appraisal.update({
    where: { id: appraisalId },
    data: { status: "APPOINTMENT_BOOKED" },
  });

  return NextResponse.json(appointment);
}
