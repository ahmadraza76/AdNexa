import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { rejectCrossOriginRequest } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 });
  }

  try {
    const upstream = await backendFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json({ detail: data.detail || "Unable to sign in" }, { status: upstream.status });
    }

    const response = NextResponse.json({ user: data.user });
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
