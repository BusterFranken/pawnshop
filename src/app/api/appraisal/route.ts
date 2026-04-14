import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getOrCreateAnonymousUserId,
  setAnonymousUserCookie,
} from "@/lib/anonymous-user";

export async function POST(req: NextRequest) {
  const { images, notes } = await req.json();

  if (!images?.length) {
    return NextResponse.json(
      { error: "At least one image is required" },
      { status: 400 }
    );
  }

  // Prefer logged-in user, fall back to anonymous cookie
  let userId: string;
  let isNewAnonymous = false;

  const session = await auth();
  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    const result = await getOrCreateAnonymousUserId();
    userId = result.userId;
    isNewAnonymous = result.isNew;
  }

  const appraisal = await db.appraisal.create({
    data: {
      userId,
      status: "DRAFT",
      userNotes: notes || null,
      images: {
        create: images.map((img: { key: string; url: string }, i: number) => ({
          key: img.key,
          url: img.url,
          order: i,
        })),
      },
    },
    include: { images: true },
  });

  const response = NextResponse.json({ id: appraisal.id, userId });
  if (isNewAnonymous) {
    setAnonymousUserCookie(response, userId);
  }
  return response;
}
