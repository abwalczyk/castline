import "server-only";

export function twitchConfigured() {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

export async function twitchLoginFromCode(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID ?? "",
    client_secret: process.env.TWITCH_CLIENT_SECRET ?? "",
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", body });
  if (!tokenResponse.ok) return null;
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) return null;
  const userResponse = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID ?? "",
    },
  });
  if (!userResponse.ok) return null;
  const payload = (await userResponse.json()) as { data?: { login?: string }[] };
  return payload.data?.[0]?.login ?? null;
}
