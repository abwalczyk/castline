import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requestOrigin } from "@/lib/origin";
import { confirmTwitch } from "@/lib/operations";
import { twitchLoginFromCode } from "@/lib/twitch";

export async function GET(request: Request) {
  const origin = await requestOrigin();
  const user = await getCurrentUser();
  if (!user || user.role !== "streamer") return NextResponse.redirect(new URL("/login", origin));
  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get("castline_twitch_state")?.value;
  jar.set("castline_twitch_state", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  const code = url.searchParams.get("code");
  if (!expected || expected !== url.searchParams.get("state") || !code) {
    return NextResponse.redirect(new URL("/streamer/channel?twitch=error", origin));
  }
  try {
    const login = await twitchLoginFromCode(code, `${origin}/api/twitch/callback`);
    if (!login) return NextResponse.redirect(new URL("/streamer/channel?twitch=error", origin));
    await confirmTwitch(user, login);
  } catch {
    return NextResponse.redirect(new URL("/streamer/channel?twitch=error", origin));
  }
  return NextResponse.redirect(new URL("/streamer/channel?twitch=verified", origin));
}
