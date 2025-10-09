// home/ubuntu/impaktrweb/src/app/api/payments/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !endpointSecret) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
  }

  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, planType, organizationId } = session.metadata!;

  // Update user subscription
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Add subscription fields to your user model
      subscriptionPlan: planType,
      subscriptionStatus: 'active',
      stripeCustomerId: session.customer as string,
      subscriptionId: session.subscription as string,
    }
  });

  // If it's an organization subscription
  if (organizationId) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionPlan: planType,
        subscriptionStatus: 'active',
        stripeCustomerId: session.customer as string,
        subscriptionId: session.subscription as string,
      }
    });
  }

  // Send welcome email
  // await sendSubscriptionWelcomeEmail(userId, planType);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: subscription.status,
      }
    });
  }

  // Also check organizations
  const organization = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (organization) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        subscriptionStatus: subscription.status,
      }
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Update user subscription status
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'cancelled',
        subscriptionPlan: null,
      }
    });
  }

  // Also check organizations
  const organization = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (organization) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        subscriptionStatus: 'cancelled',
        subscriptionPlan: null,
      }
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Find user and send payment failed notification
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (user) {
    // Send payment failed email
    // await sendPaymentFailedEmail(user.id);
    
    // Create notification
    // await createNotification(user.id, 'payment_failed', 'Payment Failed', 'Your payment could not be processed. Please update your payment method.');
  }
}