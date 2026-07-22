// Handles email+password SIGNUP. NextAuth's Credentials provider only
// handles LOGIN (checking a password that already exists) — creating the
// account in the first place is regular application logic, same as any
// Express "POST /register" route you've written before.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // NEVER store the plain password. bcrypt.hash with 10 salt rounds is
  // the standard, well-tested default — high enough to resist brute force,
  // low enough to not noticeably slow down signup.
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name: name || null },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
