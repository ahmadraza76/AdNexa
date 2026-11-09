import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { rejectCrossOriginRequest } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const refreshToken = request.cookies.get("adnexa_refresh_token")?.value;
  if (refreshToken) {
    try {
      await backendFetch("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Clear browser credentials even if the API is temporarily unreachable.
    }
  }

  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("adnexa_access_token", "", {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0,
  });
  response.cookies.set("adnexa_refresh_token", "", {
    httpOnly: true, secure, sameSite: "lax", path: "/api/auth", maxAge: 0,
  });
  return response;
}
