import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { rejectCrossOriginRequest } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const refreshToken = request.cookies.get("adnexa_refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.json({ detail: "Refresh session is unavailable" }, { status: 401 });
  }

  try {
    const upstream = await backendFetch("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const response = NextResponse.json(
        { detail: data.detail || "Session expired. Please sign in again." },
        { status: upstream.status },
      );
      if (upstream.status === 401) {
        const secure = process.env.NODE_ENV === "production";
        response.cookies.set("adnexa_access_token", "", {
          httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0,
        });
        response.cookies.set("adnexa_refresh_token", "", {
          httpOnly: true, secure, sameSite: "lax", path: "/api/auth", maxAge: 0,
        });
      }
      return response;
    }

    const response = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("adnexa_access_token", data.access_token, {
      httpOnly: true, secure, sameSite: "lax", path: "/",
      maxAge: Math.max(0, Number(data.expires_in) || 0),
    });
    response.cookies.set("adnexa_refresh_token", data.refresh_token, {
      httpOnly: true, secure, sameSite: "lax", path: "/api/auth",
      maxAge: Math.max(0, Number(data.refresh_expires_in) || 0),
    });
    return response;
  } catch {
    return NextResponse.json({ detail: "AdNexa API is unavailable. Please try again." }, { status: 503 });
  }
}
