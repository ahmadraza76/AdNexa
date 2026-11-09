import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const token = (await cookies()).get("adnexa_access_token")?.value;
  if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });

  try {
    const upstream = await backendFetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return NextResponse.json({ detail: data.detail || "Session expired" }, { status: upstream.status });
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ detail: "AdNexa API is unavailable" }, { status: 503 });
  }
}
