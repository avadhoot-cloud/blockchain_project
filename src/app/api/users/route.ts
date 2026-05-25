import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const sellers = await prisma.user.findMany({
      where: {
        role: {
          in: ["SELLER", "BOTH"],
        },
      },
      select: {
        id: true,
        username: true,
        walletAddress: true,
      },
      orderBy: { username: "asc" },
    });
    
    return NextResponse.json(sellers);
  } catch (error) {
    console.error("Failed to fetch registered sellers:", error);
    return NextResponse.json({ error: "Failed to fetch registered sellers" }, { status: 500 });
  }
}
