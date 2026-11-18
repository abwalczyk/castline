import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, type Role } from "@/lib/constants";
import { one, query, ready } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { homeForRole } from "@/lib/paths";
import { newToken, sha256, verifyPassword } from "@/lib/password";
import { mapUser } from "@/lib/rows";
import { findUserByEmail } from "@/lib/store";

const COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  await ready();
  if (!token) return null;
  const row = await one(
    `select u.id, u.email, u.name, u.role::text as role, u.status::text as status
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now() and u.status = 'active'`,
    [sha256(token)],
  );
  return row ? mapUser(row) : null;
});

export async function authenticate(email: string, password: string) {
  const found = await findUserByEmail(email);
  if (!found || !(await verifyPassword(password, found.passwordHash))) {
    throw new AppError("Email or password is incorrect.");
  }
  if (found.user.status === "suspended") throw new AppError("This account is suspended.");
  if (found.user.status === "pending") throw new AppError("This account is waiting for approval.");
  return found.user;
}

export async function createSession(userId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + COOKIE.maxAge * 1000);
  await query(`insert into sessions (id, user_id, token_hash, expires_at) values ($1, $2, $3, $4)`, [
    randomUUID(),
    userId,
    sha256(token),
    expires.toISOString(),
  ]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { ...COOKIE, expires });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query(`delete from sessions where token_hash = $1`, [sha256(token)]);
  jar.set(SESSION_COOKIE, "", { ...COOKIE, maxAge: 0 });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) redirect(homeForRole(user.role));
  return user;
}
