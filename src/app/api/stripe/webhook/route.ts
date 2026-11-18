import { getStripe, markCampaignPaid, syncStripeRefund } from "@/lib/payments";
import { paymentById } from "@/lib/store";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Stripe is not configured", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  const body = await request.text();
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (session.payment_status === "paid" && paymentId) {
      const payment = await paymentById(paymentId);
      const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
      if (payment?.status === "pending" && session.amount_total === payment.amountCents) {
        await markCampaignPaid(payment.id, intent);
      }
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (intent) await syncStripeRefund(intent, charge.amount_refunded);
  }

  return Response.json({ received: true });
}
