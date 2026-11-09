import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginRequest } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const response = NextResponse.json({ ok: true });
  response.cookies.set("adnexa_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
