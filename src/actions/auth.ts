"use server";

import { unstable_rethrow } from "next/navigation";
import { redirect } from "next/navigation";
import { run } from "@/lib/action-run";
import { AppError } from "@/lib/errors";
import { authenticate, createSession, destroySession } from "@/lib/auth";
import { DEMO_PASSWORD, demoEnabled } from "@/lib/demo";
import { field } from "@/lib/fields";
import { homeForRole, safeNextPath } from "@/lib/paths";
import { registerAgency, registerBrand, registerStreamer } from "@/lib/operations";
import { parseEmail, parsePassword, parsePersonName } from "@/lib/validate";

export async function login(_state: unknown, formData: FormData) {
  return run(async () => {
    const email = parseEmail(formData.get("email"));
    const passwordValue = formData.get("password");
    const password = typeof passwordValue === "string" ? passwordValue : "";
    if (!email || !password) throw new AppError("Enter your email and password.");
    const user = await authenticate(email, password);
    await createSession(user.id);
    redirect(safeNextPath(field(formData.get("next")), homeForRole(user.role)));
  });
}

export async function loginAsDemo(formData: FormData) {
  if (!demoEnabled()) redirect("/login");
  try {
    const email = parseEmail(formData.get("email"));
    if (!email) redirect("/login");
    const user = await authenticate(email, DEMO_PASSWORD);
    await createSession(user.id);
    redirect(homeForRole(user.role));
  } catch (error) {
    unstable_rethrow(error);
    redirect("/login?error=demo");
  }
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function registerBrandAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const email = parseEmail(formData.get("email"));
    const password = parsePassword(formData.get("password"));
    const name = parsePersonName(formData.get("name"));
    const companyName = field(formData.get("companyName"));
    if (!email || !password || !name) {
      throw new AppError("Use a valid email, your name, and a password of at least 10 characters.");
    }
    if (companyName.length < 2) throw new AppError("Enter the company name.");
    const userId = await registerBrand({
      email,
      password,
      name,
      companyName,
      website: field(formData.get("website")),
      industry: field(formData.get("industry")),
    });
    await createSession(userId);
    redirect("/brand");
  });
}

export async function registerStreamerAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const email = parseEmail(formData.get("email"));
    const password = parsePassword(formData.get("password"));
    const name = parsePersonName(formData.get("name"));
    const displayName = field(formData.get("displayName"));
    if (!email || !password || !name) {
      throw new AppError("Use a valid email, your name, and a password of at least 10 characters.");
    }
    if (displayName.length < 2) throw new AppError("Enter the name viewers know.");
    const userId = await registerStreamer({
      email,
      password,
      name,
      displayName,
      twitch: field(formData.get("twitch")),
      category: field(formData.get("category")),
    });
    await createSession(userId);
    redirect("/streamer");
  });
}

export async function registerAgencyAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const email = parseEmail(formData.get("email"));
    const password = parsePassword(formData.get("password"));
    const name = parsePersonName(formData.get("name"));
    const agencyName = field(formData.get("agencyName"));
    if (!email || !password || !name) {
      throw new AppError("Use a valid email, your name, and a password of at least 10 characters.");
    }
    if (agencyName.length < 2) throw new AppError("Enter the agency name.");
    const userId = await registerAgency({
      email,
      password,
      name,
      agencyName,
      website: field(formData.get("website")),
    });
    await createSession(userId);
    redirect("/agency");
  });
}
