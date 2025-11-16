import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlan, calculateUsageBasedPrice } from '../tenants/plans';
import type { PlanTier } from '../tenants/plans';

/**
 * Tenant Billing Service
 * Handles per-tenant Stripe subscriptions, usage tracking, and billing
 */
export class TenantBillingService {
  private stripe: Stripe;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  /**
   * Create Stripe customer for tenant
   */
  async createCustomer(tenantId: string, data: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: data.email,
      name: data.name,
      metadata: {
        tenantId,
        ...data.metadata,
      },
    });

    // Update tenant with customer ID
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);
    await supabase
      .from('tenants')
      .update({ stripe_customer_id: customer.id })
      .eq('id', tenantId);

    return customer.id;
  }

  /**
   * Create subscription for tenant
   */
  async createSubscription(
    tenantId: string,
    plan: PlanTier,
    options?: {
      trialDays?: number;
      paymentMethodId?: string;
    }
  ): Promise<Stripe.Subscription> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_customer_id, name, email_branding')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    let customerId = tenant.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      customerId = await this.createCustomer(tenantId, {
        email: tenant.email_branding?.replyTo || 'noreply@example.com',
        name: tenant.name,
      });
    }

    // Get plan details
    const planConfig = getPlan(plan);

    // Create price if not exists (you should create these in Stripe dashboard)
    // For now, we'll use a price amount
    const priceAmount = planConfig.pricing.monthly * 100; // Convert to cents

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planConfig.name} Plan`,
              metadata: {
                plan,
                tenantId,
              },
            },
            unit_amount: priceAmount,
            recurring: {
              interval: 'month',
            },
          },
        },
      ],
      trial_period_days: options?.trialDays || planConfig.pricing.trialDays,
      default_payment_method: options?.paymentMethodId,
      metadata: {
        tenantId,
        plan,
      },
    });

    // Update tenant with subscription info
    await supabase
      .from('tenants')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_plan: plan,
        subscription_status: subscription.status === 'trialing' ? 'trial' : 'active',
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      })
      .eq('id', tenantId);

    return subscription;
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    tenantId: string,
    newPlan: PlanTier
  ): Promise<Stripe.Subscription> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_subscription_id')
      .eq('id', tenantId)
      .single();

    if (!tenant?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    // Get current subscription
    const subscription = await this.stripe.subscriptions.retrieve(
      tenant.stripe_subscription_id
    );

    // Get new plan details
    const planConfig = getPlan(newPlan);
    const priceAmount = planConfig.pricing.monthly * 100;

    // Update subscription
    const updatedSubscription = await this.stripe.subscriptions.update(
      subscription.id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${planConfig.name} Plan`,
                metadata: {
                  plan: newPlan,
                  tenantId,
                },
              },
              unit_amount: priceAmount,
              recurring: {
                interval: 'month',
              },
            },
          },
        ],
        proration_behavior: 'always_invoice',
        metadata: {
          tenantId,
          plan: newPlan,
        },
      }
    );

    // Update tenant
    await supabase
      .from('tenants')
      .update({
        subscription_plan: newPlan,
        features: planConfig.features,
      })
      .eq('id', tenantId);

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    tenantId: string,
    immediately: boolean = false
  ): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_subscription_id')
      .eq('id', tenantId)
      .single();

    if (!tenant?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    if (immediately) {
      // Cancel immediately
      await this.stripe.subscriptions.cancel(tenant.stripe_subscription_id);

      await supabase
        .from('tenants')
        .update({
          subscription_status: 'cancelled',
          subscription_ends_at: new Date().toISOString(),
        })
        .eq('id', tenantId);
    } else {
      // Cancel at period end
      await this.stripe.subscriptions.update(tenant.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      const subscription = await this.stripe.subscriptions.retrieve(
        tenant.stripe_subscription_id
      );

      await supabase
        .from('tenants')
        .update({
          subscription_ends_at: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        })
        .eq('id', tenantId);
    }
  }

  /**
   * Track usage and create usage-based invoice
   */
  async trackUsage(
    tenantId: string
  ): Promise<{
    basePlan: number;
    overages: any;
    total: number;
  }> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('subscription_plan, usage')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Calculate usage-based pricing
    const pricing = calculateUsageBasedPrice(
      tenant.subscription_plan,
      tenant.usage
    );

    // If there are overage charges, create invoice item
    const totalOverage =
      pricing.overageCharges.users +
      pricing.overageCharges.storage +
      pricing.overageCharges.orders;

    if (totalOverage > 0) {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('stripe_customer_id')
        .eq('id', tenantId)
        .single();

      if (tenantData?.stripe_customer_id) {
        await this.stripe.invoiceItems.create({
          customer: tenantData.stripe_customer_id,
          amount: Math.round(totalOverage * 100), // Convert to cents
          currency: 'usd',
          description: 'Usage overage charges',
          metadata: {
            tenantId,
            users: pricing.overageCharges.users,
            storage: pricing.overageCharges.storage,
            orders: pricing.overageCharges.orders,
          },
        });
      }
    }

    return pricing;
  }

  /**
   * Get billing history
   */
  async getBillingHistory(tenantId: string): Promise<any[]> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data: history } = await supabase
      .from('tenant_billing_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    return history || [];
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;

        if (tenantId) {
          await supabase
            .from('tenants')
            .update({
              subscription_status:
                subscription.status === 'trialing'
                  ? 'trial'
                  : subscription.status === 'active'
                  ? 'active'
                  : 'suspended',
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            })
            .eq('id', tenantId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;

        if (tenantId) {
          await supabase
            .from('tenants')
            .update({
              subscription_status: 'cancelled',
              subscription_ends_at: new Date().toISOString(),
            })
            .eq('id', tenantId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get tenant by customer ID
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (tenant) {
          // Record payment
          await supabase.from('tenant_billing_history').insert({
            tenant_id: tenant.id,
            invoice_id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            status: 'paid',
            period_start: invoice.period_start
              ? new Date(invoice.period_start * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            period_end: invoice.period_end
              ? new Date(invoice.period_end * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            paid_at: new Date().toISOString(),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get tenant by customer ID
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (tenant) {
          // Update subscription status
          await supabase
            .from('tenants')
            .update({ subscription_status: 'suspended' })
            .eq('id', tenant.id);

          // Record failed payment
          await supabase.from('tenant_billing_history').insert({
            tenant_id: tenant.id,
            invoice_id: invoice.id,
            amount: invoice.amount_due / 100,
            currency: invoice.currency.toUpperCase(),
            status: 'failed',
            period_start: invoice.period_start
              ? new Date(invoice.period_start * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            period_end: invoice.period_end
              ? new Date(invoice.period_end * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
          });
        }
        break;
      }
    }
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(tenantId: string): Promise<Stripe.Invoice | null> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_customer_id')
      .eq('id', tenantId)
      .single();

    if (!tenant?.stripe_customer_id) {
      return null;
    }

    try {
      const invoice = await this.stripe.invoices.retrieveUpcoming({
        customer: tenant.stripe_customer_id,
      });

      return invoice;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton
export const tenantBillingService = new TenantBillingService();
