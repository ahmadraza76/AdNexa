import assert from "node:assert/strict";
import test from "node:test";
import {
  SESSION_LOCK_UNAVAILABLE_MESSAGE,
  withSessionRefreshLock,
} from "../lib/session-lock";

function createSerialLockManager(): Pick<LockManager, "request"> {
  let tail: Promise<void> = Promise.resolve();

  return {
    request: async (_name, _options, callback) => {
      const previous = tail;
      let release!: () => void;
      tail = new Promise<void>((resolve) => {
        release = resolve;
      });

      await previous;
      try {
        return await callback({} as Lock);
      } finally {
        release();
      }
    },
  } as Pick<LockManager, "request">;
}

test("serializes session refresh operations using an exclusive cross-tab lock", async () => {
  const locks = createSerialLockManager();
  let active = 0;
  let maximumActive = 0;
  let releaseFirst!: () => void;
  let markFirstStarted!: () => void;

  const firstStarted = new Promise<void>((resolve) => {
    markFirstStarted = resolve;
  });
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = withSessionRefreshLock(locks, async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    markFirstStarted();
    await firstGate;
    active -= 1;
    return "first";
  });

  await firstStarted;

  let secondStarted = false;
  const second = withSessionRefreshLock(locks, async () => {
    secondStarted = true;
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    active -= 1;
    return "second";
  });

  await Promise.resolve();
  assert.equal(secondStarted, false);

  releaseFirst();
  assert.deepEqual(await Promise.all([first, second]), ["first", "second"]);
  assert.equal(maximumActive, 1);
});

test("does not attempt an unsafe refresh when Web Locks are unavailable", async () => {
  let operationCalled = false;

  await assert.rejects(
    withSessionRefreshLock(undefined, async () => {
      operationCalled = true;
      return "unexpected";
    }),
    new Error(SESSION_LOCK_UNAVAILABLE_MESSAGE),
  );

  assert.equal(operationCalled, false);
});
