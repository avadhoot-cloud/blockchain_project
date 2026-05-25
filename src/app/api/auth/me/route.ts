import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        username: payload.username,
        walletAddress: payload.walletAddress,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { authenticated: false, user: null, error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
