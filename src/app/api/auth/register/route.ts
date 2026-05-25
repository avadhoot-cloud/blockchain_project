import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password is too long"),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum public wallet address format"),
  role: z.enum(["BUYER", "SELLER", "BOTH"], {
    errorMap: () => ({ message: "Role must be BUYER, SELLER, or BOTH" }),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate inputs
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, password, walletAddress, role } = result.data;
    const cleanWallet = walletAddress.toLowerCase();

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already registered" },
        { status: 409 }
      );
    }

    // Check if wallet address already bound
    const existingWallet = await prisma.user.findUnique({
      where: { walletAddress: cleanWallet },
    });
    if (existingWallet) {
      return NextResponse.json(
        { error: "This wallet address is already registered to another account" },
        { status: 409 }
      );
    }

    // Secure password hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to SQLite DB
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        walletAddress: cleanWallet,
        role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
