import { createHash } from "node:crypto";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function checkRateLimit(identifier: string) {
  const keyHash = hashKey(identifier);
  const record = await db.authRateLimit.findUnique({ where: { keyHash } });

  if (!record) {
    return { allowed: true as const, keyHash };
  }

  const now = new Date();
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000);
    return { allowed: false as const, keyHash, retryAfterSeconds };
  }

  if (now.getTime() - record.windowStart.getTime() >= WINDOW_MS) {
    await db.authRateLimit.update({
      where: { keyHash },
      data: { attempts: 0, windowStart: now, lockedUntil: null },
    });
  }

  return { allowed: true as const, keyHash };
}

export async function registerFailedAttempt(keyHash: string) {
  const now = new Date();
  const current = await db.authRateLimit.upsert({
    where: { keyHash },
    create: { keyHash, attempts: 1, windowStart: now },
    update: { attempts: { increment: 1 } },
  });

  if (current.attempts >= MAX_ATTEMPTS) {
    await db.authRateLimit.update({
      where: { keyHash },
      data: { lockedUntil: new Date(now.getTime() + LOCK_MS) },
    });
  }
}

export async function clearRateLimit(keyHash: string) {
  await db.authRateLimit.deleteMany({ where: { keyHash } });
}

