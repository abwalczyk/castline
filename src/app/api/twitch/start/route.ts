import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requestOrigin } from "@/lib/origin";
import { newToken } from "@/lib/password";
import { twitchConfigured } from "@/lib/twitch";

export async function GET() {
  const origin = await requestOrigin();
  const user = await getCurrentUser();
  if (!user || user.role !== "streamer") return NextResponse.redirect(new URL("/login", origin));
  if (!twitchConfigured()) return NextResponse.redirect(new URL("/streamer/channel?twitch=unconfigured", origin));
  const state = newToken();
  const jar = await cookies();
  jar.set("castline_twitch_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", `${origin}/api/twitch/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user:read:email");
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
