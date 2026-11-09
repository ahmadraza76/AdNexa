import { NextRequest, NextResponse } from "next/server";

/**
 * Browser-facing mutation routes must carry a verifiable same-origin
 * Origin or Referer header. Reject cross-site Fetch Metadata as a
 * second independent signal. This is intentionally strict: requests
 * without either origin signal are rejected rather than guessed safe.
 */
export function rejectCrossOriginRequest(request: NextRequest): NextResponse | null {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") {
    return NextResponse.json({ detail: "Cross-origin request rejected" }, { status: 403 });
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const source = originHeader || refererHeader;

  if (!source || source.toLowerCase() === "null") {
    return NextResponse.json({ detail: "Request origin is required" }, { status: 403 });
  }

  try {
    const sourceUrl = new URL(source);
    const requestUrl = new URL(request.url);
    if (sourceUrl.origin !== requestUrl.origin) {
      return NextResponse.json({ detail: "Cross-origin request rejected" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ detail: "Invalid request origin" }, { status: 403 });
  }

  return null;
}
