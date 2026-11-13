export const SESSION_LOCK_UNAVAILABLE_MESSAGE =
  "Your browser does not support safe cross-tab session refresh. Please update your browser.";

type SessionLockManager = Pick<LockManager, "request">;

/**
 * Serialize session bootstrap/refresh requests across tabs in the same origin.
 * The browser applies Set-Cookie from the lock holder before the next holder
 * starts its request, so queued tabs read the rotated refresh cookie.
 */
export async function withSessionRefreshLock<T>(
  locks: SessionLockManager | undefined,
  operation: () => Promise<T>,
): Promise<T> {
  if (!locks) {
    throw new Error(SESSION_LOCK_UNAVAILABLE_MESSAGE);
  }

  return locks.request("adnexa-auth-session-refresh", { mode: "exclusive" }, operation);
}
