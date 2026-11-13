import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { rejectCrossOriginRequest } from "@/lib/csrf";

type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
};

function clearSession(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("adnexa_access_token", "", {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0,
  });
  response.cookies.set("adnexa_refresh_token", "", {
    httpOnly: true, secure, sameSite: "lax", path: "/api/auth", maxAge: 0,
  });
}

function setSession(response: NextResponse, tokens: TokenPair) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("adnexa_access_token", tokens.access_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/",
    maxAge: Math.max(0, Number(tokens.expires_in) || 0),
  });
  response.cookies.set("adnexa_refresh_token", tokens.refresh_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/api/auth",
    maxAge: Math.max(0, Number(tokens.refresh_expires_in) || 0),
  });
}

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const cookieStore = request.cookies;
  let accessToken = cookieStore.get("adnexa_access_token")?.value;
  const refreshToken = cookieStore.get("adnexa_refresh_token")?.value;
  let rotatedTokens: TokenPair | null = null;

  try {
    let accountResponse: Response | null = null;

    if (accessToken) {
      accountResponse = await backendFetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (accountResponse.status !== 401 && !accountResponse.ok) {
        return NextResponse.json(
          { detail: "Unable to verify your session" },
          { status: accountResponse.status },
        );
      }
    }

    if (!accountResponse || accountResponse.status === 401) {
      if (!refreshToken) {
        const response = NextResponse.json({ detail: "Authentication required" }, { status: 401 });
        clearSession(response);
        return response;
      }

      const refreshResponse = await backendFetch("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const refreshData = await refreshResponse.json().catch(() => ({}));

      if (!refreshResponse.ok) {
        if (refreshResponse.status === 401 || refreshResponse.status === 422) {
          const response = NextResponse.json(
            { detail: "Your session has expired. Please sign in again." },
            { status: 401 },
          );
          clearSession(response);
          return response;
        }
        return NextResponse.json(
          { detail: "Unable to refresh your session right now." },
          { status: refreshResponse.status },
        );
      }

      rotatedTokens = refreshData as TokenPair;
      if (!rotatedTokens.access_token || !rotatedTokens.refresh_token) {
        return NextResponse.json({ detail: "Invalid refresh response from API" }, { status: 502 });
      }
      accessToken = rotatedTokens.access_token;
      accountResponse = await backendFetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    if (!accountResponse?.ok) {
      const status = accountResponse?.status ?? 502;
      const response = NextResponse.json(
        { detail: status === 401 ? "Your session has expired. Please sign in again." : "Unable to load your account." },
        { status },
      );
      if (status === 401) clearSession(response);
      return response;
    }

    const account = await accountResponse.json();
    const response = NextResponse.json({ user: account });
    if (rotatedTokens) setSession(response, rotatedTokens);
    return response;
  } catch {
    return NextResponse.json(
      { detail: "AdNexa API is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
