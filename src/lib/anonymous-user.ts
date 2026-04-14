import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "pawnshop_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getAnonymousUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const user = await db.user.findUnique({
    where: { id: cookie.value },
    select: { id: true },
  });
  return user ? user.id : null;
}

export async function getOrCreateAnonymousUserId(): Promise<{
  userId: string;
  isNew: boolean;
}> {
  const existing = await getAnonymousUserId();
  if (existing) return { userId: existing, isNew: false };

  const user = await db.user.create({
    data: { isAnonymous: true },
  });
  return { userId: user.id, isNew: true };
}

export function setAnonymousUserCookie(
  response: Response,
  userId: string
): void {
  const cookie = `${COOKIE_NAME}=${userId}; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}; Path=/`;
  response.headers.append("Set-Cookie", cookie);
}

export { COOKIE_NAME };
