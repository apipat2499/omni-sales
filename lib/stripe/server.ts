import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
});

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: metadata || {},
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const retrievePaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};

export const createInvoice = async (
  customerId: string,
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>,
  metadata?: Record<string, string>
) => {
  try {
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      metadata: metadata || {},
    });

    // Add items to invoice
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        description: item.description,
        amount: Math.round(item.amount * 100),
        quantity: item.quantity,
      });
    }

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    return finalizedInvoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const listInvoices = async (customerId: string) => {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });
    return invoices.data;
  } catch (error) {
    console.error('Error listing invoices:', error);
    throw error;
  }
};

export const sendInvoice = async (invoiceId: string) => {
  try {
    const invoice = await stripe.invoices.sendInvoice(invoiceId);
    return invoice;
  } catch (error) {
    console.error('Error sending invoice:', error);
    throw error;
  }
};

export const verifyWebhookSignature = (
  body: string,
  signature: string,
  secret: string
) => {
  return stripe.webhooks.constructEvent(body, signature, secret);
};

export { stripe };
