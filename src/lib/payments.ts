import "server-only";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { todayIso } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { commissionOn } from "@/lib/pricing";
import {
  addRefund,
  attachCheckout,
  audit,
  earningExists,
  getCampaign,
  getSettings,
  insertEarning,
  insertPayment,
  markPaymentPaid,
  participants,
  paymentById,
  paymentByIntent,
  reverseUnpaidEarnings,
  setCampaignStatus,
  setRefundedTotal,
} from "@/lib/store";
import type { Campaign } from "@/lib/types";

const API_VERSION = "2026-10-28.endive" as const;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: API_VERSION, typescript: true });
}

export function simulatePaymentsAllowed() {
  return !process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production";
}

export async function beginCheckout(campaign: Campaign, origin: string) {
  if (campaign.status !== "approved" && campaign.status !== "payment_pending") {
    throw new AppError("This campaign is not ready for payment.");
  }
  const today = await todayIso();
  if (!campaign.startDate || !campaign.endDate || campaign.endDate < today) {
    throw new AppError("This campaign window has already ended.");
  }
  const lines = await participants(campaign.id);
  const amount = lines.reduce((sum, line) => sum + line.rateCents, 0);
  if (amount <= 0) throw new AppError("Add a priced creator before paying.");
  const settings = await getSettings();
  const commission = lines.reduce((sum, line) => sum + commissionOn(line.rateCents, settings.commissionBps), 0);
  const paymentId = randomUUID();
  await setCampaignStatus(campaign.id, "payment_pending");
  await insertPayment({
    id: paymentId,
    campaignId: campaign.id,
    amountCents: amount,
    commissionCents: commission,
    currency: settings.currency,
  });

  const stripe = getStripe();
  if (!stripe) {
    if (!simulatePaymentsAllowed()) throw new AppError("Stripe is not configured.");
    return { paymentId, url: null as string | null, amountCents: amount, commissionCents: commission };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/brand/campaigns/${campaign.id}?paid=1`,
    cancel_url: `${origin}/brand/campaigns/${campaign.id}/checkout?cancelled=1`,
    client_reference_id: paymentId,
    metadata: { campaignId: campaign.id, paymentId },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: settings.currency,
          unit_amount: amount,
          product_data: {
            name: campaign.name,
            description: "Castline sponsored placement",
          },
        },
      },
    ],
  });
  if (!session.url) throw new AppError("Stripe did not return a checkout URL.");
  await attachCheckout(paymentId, session.id);
  return { paymentId, url: session.url, amountCents: amount, commissionCents: commission };
}

export async function markCampaignPaid(paymentId: string, paymentIntentId: string | null) {
  const payment = await paymentById(paymentId);
  if (!payment || payment.status === "paid") return;
  if (payment.status !== "pending") return;
  const campaign = await getCampaign(payment.campaignId);
  if (!campaign?.startDate || !campaign.endDate) throw new AppError("Campaign dates are missing.");
  const today = await todayIso();
  if (campaign.endDate < today) throw new AppError("This campaign window has already ended.");
  await markPaymentPaid(payment.id, paymentIntentId);
  const settings = await getSettings();
  for (const line of await participants(campaign.id)) {
    if (await earningExists(campaign.id, line.streamerId)) continue;
    const commission = commissionOn(line.rateCents, settings.commissionBps);
    await insertEarning({
      id: randomUUID(),
      streamerId: line.streamerId,
      campaignId: campaign.id,
      paymentId: payment.id,
      grossCents: line.rateCents,
      commissionCents: commission,
      netCents: line.rateCents - commission,
    });
  }
  await setCampaignStatus(campaign.id, campaign.startDate > today ? "scheduled" : "active");
  await audit(null, "campaign.paid", "campaign", campaign.id, { paymentId, amountCents: payment.amountCents });
}

export async function refundPayment(actorId: string, paymentId: string, amountCents: number, note: string) {
  const payment = await paymentById(paymentId);
  if (!payment || (payment.status !== "paid" && payment.status !== "refunded")) {
    throw new AppError("This payment cannot be refunded.");
  }
  const remaining = payment.amountCents - payment.refundedCents;
  if (amountCents < 1 || amountCents > remaining) {
    throw new AppError("That refund is outside the remaining balance.");
  }
  if (payment.stripePaymentIntentId) {
    const stripe = getStripe();
    if (!stripe) throw new AppError("Stripe is not configured, so this charge cannot be refunded here.");
    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId, amount: amountCents });
  }
  const full = amountCents === remaining;
  await addRefund(payment.id, amountCents, full);
  if (full) {
    await reverseUnpaidEarnings(payment.campaignId);
    await setCampaignStatus(payment.campaignId, "cancelled");
  }
  await audit(actorId, full ? "payment.refunded" : "payment.partially_refunded", "payment", payment.id, {
    amountCents,
    note,
  });
}

export async function syncStripeRefund(paymentIntentId: string, refundedCents: number) {
  if (!Number.isInteger(refundedCents) || refundedCents < 0) return;
  const payment = await paymentByIntent(paymentIntentId);
  if (!payment || refundedCents <= payment.refundedCents) return;
  await setRefundedTotal(payment.id, refundedCents);
  if (refundedCents >= payment.amountCents) await reverseUnpaidEarnings(payment.campaignId);
  await audit(null, "payment.refund_synced", "payment", payment.id, { refundedCents });
}
