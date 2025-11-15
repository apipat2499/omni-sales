import { supabase } from '@/lib/supabase/client';

export const MARKETPLACE_PLATFORMS = [
  {
    name: 'Shopee',
    code: 'shopee',
    iconUrl: 'https://cf.shopee.co.th/file/ad01f2c55d9dd6cbbc20ff5a8e9e37a7',
    apiBaseUrl: 'https://partner.shopeemall.com/api/v2',
    description: 'Connect your Shopee shop to sync orders automatically',
    isActive: true,
  },
  {
    name: 'Lazada',
    code: 'lazada',
    iconUrl:
      'https://laz-img-cdn.alicdn.com/images/ims-orig/tps/i1/O1CN01Z5paLn1E7RjY91sHJ_!!6000000000318-2-tps-1024-1024.png',
    apiBaseUrl: 'https://api.lazada.co.th/rest/api/2.0',
    description: 'Connect your Lazada shop to sync orders automatically',
    isActive: true,
  },
  {
    name: 'Facebook Shop',
    code: 'facebook',
    iconUrl: 'https://www.facebook.com/images/icons/og-image-fb-icon.png',
    apiBaseUrl: 'https://graph.facebook.com/v18.0',
    description: 'Connect your Facebook Shop to sync orders automatically',
    isActive: true,
  },
];

export async function initializeMarketplacePlatforms() {
  try {
    // Check if platforms already exist
    const { data: existing } = await supabase
      .from('marketplace_platforms')
      .select('code')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('Marketplace platforms already initialized');
      return;
    }

    // Insert platforms
    const { error } = await supabase
      .from('marketplace_platforms')
      .insert(MARKETPLACE_PLATFORMS);

    if (error) {
      console.error('Failed to initialize marketplace platforms:', error);
      throw error;
    }

    console.log('Marketplace platforms initialized successfully');
  } catch (error) {
    console.error('Error initializing marketplace platforms:', error);
    throw error;
  }
}

export async function getMarketplacePlatforms() {
  try {
    const { data, error } = await supabase
      .from('marketplace_platforms')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Failed to fetch marketplace platforms:', error);
    throw error;
  }
}

export async function getMarketplacePlatformByCode(code: string) {
  try {
    const { data, error } = await supabase
      .from('marketplace_platforms')
      .select('*')
      .eq('code', code)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(`Failed to fetch marketplace platform ${code}:`, error);
    throw error;
  }
}
