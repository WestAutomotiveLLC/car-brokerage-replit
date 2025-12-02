import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY not set. Stripe functionality will not work.");
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    })
  : null;

export class StripeService {
  async createPaymentIntent(amount: number, currency: string = "usd", metadata: Record<string, string> = {}) {
    if (!stripe) throw new Error("Stripe not configured");
    
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async createRefund(paymentIntentId: string, amount?: number) {
    if (!stripe) throw new Error("Stripe not configured");
    
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    
    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }
    
    return await stripe.refunds.create(refundParams);
  }

  async getPaymentIntent(paymentIntentId: string) {
    if (!stripe) throw new Error("Stripe not configured");
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async refundBidPayment(bidId: string) {
    const bid = await storage.getBid(bidId);
    if (!bid) throw new Error("Bid not found");
    
    if (!bid.stripePaymentIntentId) {
      throw new Error("No payment found for this bid");
    }

    if (bid.isRefunded) {
      throw new Error("This bid has already been refunded");
    }

    // Create full refund
    const refund = await this.createRefund(bid.stripePaymentIntentId);

    // Update bid with refund info
    await storage.updateBidPaymentInfo(bidId, {
      stripeDepositRefundId: refund.id,
      stripeFeeRefundId: refund.id,
      isRefunded: true,
    });

    return refund;
  }
}

export const stripeService = new StripeService();
