import { NextRequest, NextResponse } from 'next/server';
import { getCustomerProfile, createOrUpdateCustomerProfile, getContacts, createContact } from '@/lib/crm/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'Missing userId or customerId' }, { status: 400 });
    }

    const [profile, contacts] = await Promise.all([
      getCustomerProfile(userId, customerId),
      getContacts(userId, customerId),
    ]);

    return NextResponse.json({
      data: {
        profile,
        contacts,
      },
    });
  } catch (error) {
    console.error('Error fetching customer CRM data:', error);
    return NextResponse.json({ error: 'Failed to fetch customer CRM data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, customerId, action, profileData, contactData } = body;

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'profile') {
      const profile = await createOrUpdateCustomerProfile(userId, customerId, profileData);
      return NextResponse.json(profile, { status: 201 });
    } else if (action === 'contact') {
      const contact = await createContact(userId, { customer_id: customerId, ...contactData });
      return NextResponse.json(contact, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating customer CRM data:', error);
    return NextResponse.json({ error: 'Failed to update customer CRM data' }, { status: 500 });
  }
}
