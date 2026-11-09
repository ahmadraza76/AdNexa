import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { rejectCrossOriginRequest } from "../lib/csrf";

const endpoint = "https://app.adnexa.example/api/auth/login";

test("allows a same-origin Origin header", () => {
  const request = new NextRequest(endpoint, {
    method: "POST",
    headers: { origin: "https://app.adnexa.example" },
  });
  assert.equal(rejectCrossOriginRequest(request), null);
});

test("allows a same-origin Referer when Origin is absent", () => {
  const request = new NextRequest(endpoint, {
    method: "POST",
    headers: { referer: "https://app.adnexa.example/login" },
  });
  assert.equal(rejectCrossOriginRequest(request), null);
});

test("rejects a foreign Origin", () => {
  const request = new NextRequest(endpoint, {
    method: "POST",
    headers: { origin: "https://attacker.example" },
  });
  assert.equal(rejectCrossOriginRequest(request)?.status, 403);
});

test("rejects cross-site Fetch Metadata even with a same-origin Origin", () => {
  const request = new NextRequest(endpoint, {
    method: "POST",
    headers: {
      origin: "https://app.adnexa.example",
      "sec-fetch-site": "cross-site",
    },
  });
  assert.equal(rejectCrossOriginRequest(request)?.status, 403);
});

test("rejects requests without Origin or Referer", () => {
  const request = new NextRequest(endpoint, { method: "POST" });
  assert.equal(rejectCrossOriginRequest(request)?.status, 403);
});

test("rejects opaque null Origin", () => {
  const request = new NextRequest(endpoint, {
    method: "POST",
    headers: { origin: "null" },
  });
  assert.equal(rejectCrossOriginRequest(request)?.status, 403);
});
