import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define protected paths
  const isBuyerPath = path.startsWith("/buyer");
  const isSellerPath = path.startsWith("/seller");
  
  if (!isBuyerPath && !isSellerPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  // If token is missing, redirect to auth page
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Verify the JWT token
  const payload = await verifyToken(token);
  if (!payload) {
    // If token is invalid, clear it and redirect to auth page
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", path);
    const response = NextResponse.redirect(url);
    response.cookies.delete("session");
    return response;
  }

  const role = payload.role as string;

  // Role-Based Access Control (RBAC)
  if (isBuyerPath && role === "SELLER") {
    // A Seller cannot access the Buyer dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/seller";
    return NextResponse.redirect(url);
  }

  if (isSellerPath && role === "BUYER") {
    // A Buyer cannot access the Seller dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/buyer";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure matcher to only intercept buyer and seller pages
export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*"],
};
