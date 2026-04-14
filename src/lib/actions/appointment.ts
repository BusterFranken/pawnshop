"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function bookAppointment(data: {
  appraisalId: string;
  shopId: string;
  scheduledAt: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Must be logged in to book an appointment");
  }

  const appointment = await db.appointment.create({
    data: {
      userId: session.user.id,
      appraisalId: data.appraisalId,
      shopId: data.shopId,
      scheduledAt: new Date(data.scheduledAt),
      notes: data.notes,
      status: "PENDING",
    },
    include: {
      shop: true,
    },
  });

  // Update appraisal status
  await db.appraisal.update({
    where: { id: data.appraisalId },
    data: { status: "APPOINTMENT_BOOKED" },
  });

  return appointment;
}

export async function getAppointments(userId: string) {
  return db.appointment.findMany({
    where: { userId },
    include: {
      appraisal: true,
      shop: true,
    },
    orderBy: { scheduledAt: "asc" },
  });
}
