"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function createAppraisal(imageData: { key: string; url: string }[]) {
  const session = await auth();
  let userId = session?.user?.id;

  // Create anonymous user if not logged in
  if (!userId) {
    const anonUser = await db.user.create({
      data: { isAnonymous: true },
    });
    userId = anonUser.id;
  }

  const appraisal = await db.appraisal.create({
    data: {
      userId,
      status: "DRAFT",
      images: {
        create: imageData.map((img, i) => ({
          key: img.key,
          url: img.url,
          order: i,
        })),
      },
    },
    include: { images: true },
  });

  return { id: appraisal.id, userId };
}

export async function getAppraisal(id: string) {
  return db.appraisal.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
