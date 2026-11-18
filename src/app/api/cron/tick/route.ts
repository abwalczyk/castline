import { tick } from "@/lib/lifecycle";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await tick();
  return Response.json({ ok: true });
}

export const GET = run;
export const POST = run;
