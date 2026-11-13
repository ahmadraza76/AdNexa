import { expect, test } from "@playwright/test";

test("two dashboard tabs use the rotated refresh cookie sequentially", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "adnexa_access_token",
      value: "expired-access",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "adnexa_refresh_token",
      value: "refresh-before-rotation",
      domain: "127.0.0.1",
      path: "/api/auth",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const refreshCookies: string[] = [];
  let requestCount = 0;

  await context.route("**/api/auth/session", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    requestCount += 1;
    const cookieHeader = request.headers().cookie ?? "";
    const refreshCookie = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("adnexa_refresh_token="));

    refreshCookies.push(refreshCookie ?? "");

    // Keep the first refresh in flight while the second tab attempts bootstrap.
    if (requestCount === 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "set-cookie":
          "adnexa_refresh_token=refresh-after-rotation; Path=/api/auth; HttpOnly; SameSite=Lax",
      },
      body: JSON.stringify({
        user: {
          id: 7,
          email: "browser-test@adnexa.test",
          full_name: "Browser Test",
          roles: ["publisher"],
          is_email_verified: true,
        },
      }),
    });
  });

  const firstTab = await context.newPage();
  const secondTab = await context.newPage();

  await Promise.all([
    firstTab.goto("/dashboard"),
    secondTab.goto("/dashboard"),
  ]);

  await expect(firstTab.getByText("Account details")).toBeVisible();
  await expect(secondTab.getByText("Account details")).toBeVisible();
  expect(requestCount).toBe(2);
  expect(refreshCookies).toEqual([
    "adnexa_refresh_token=refresh-before-rotation",
    "adnexa_refresh_token=refresh-after-rotation",
  ]);

  await context.close();
});
