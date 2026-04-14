import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { getAnonymousUserId, COOKIE_NAME } from "@/lib/anonymous-user";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await hash(password, 10);

  // Check if there's an anonymous user from the cookie
  const anonymousUserId = await getAnonymousUserId();

  let userId: string;

  if (anonymousUserId) {
    // Upgrade the anonymous user to a real account
    const user = await db.user.update({
      where: { id: anonymousUserId },
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        isAnonymous: false,
        role: "USER",
      },
    });
    userId = user.id;
  } else {
    // Create a new user
    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        isAnonymous: false,
        role: "USER",
      },
    });
    userId = user.id;
  }

  // Update the cookie to point to this user
  const response = NextResponse.json({ success: true, userId });
  const maxAge = 60 * 60 * 24 * 365;
  response.cookies.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return response;
}
