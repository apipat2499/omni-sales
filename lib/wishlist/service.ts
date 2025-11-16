import { supabase } from '@/lib/supabase/client';
import {
  Wishlist,
  WishlistItem,
  WishlistShare,
  WishlistPriceHistory,
  WishlistAnalytics,
  WishlistPreferences,
  WishlistWithItems,
} from '@/types';

/**
 * Wishlist & Favorites Management Service
 * Handles wishlists, sharing, price tracking, and analytics
 */

/**
 * Create a new wishlist
 */
export async function createWishlist(
  userId: string,
  wishlist: {
    customerEmail: string;
    wishlistName: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<Wishlist | null> {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        customer_email: wishlist.customerEmail,
        wishlist_name: wishlist.wishlistName,
        description: wishlist.description,
        is_public: wishlist.isPublic || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating wishlist:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createWishlist:', error);
    return null;
  }
}

/**
 * Add item to wishlist
 */
export async function addWishlistItem(
  userId: string,
  wishlistId: string,
  item: {
    productId: string;
    productName: string;
    productImage?: string;
    priceAtAdded: number;
    currentPrice: number;
    priority?: number;
    notes?: string;
    quantityDesired?: number;
  }
): Promise<WishlistItem | null> {
  try {
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        user_id: userId,
        wishlist_id: wishlistId,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        price_at_added: item.priceAtAdded,
        current_price: item.currentPrice,
        priority: item.priority || 0,
        notes: item.notes,
        quantity_desired: item.quantityDesired || 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding wishlist item:', error);
      return null;
    }

    // Update wishlist analytics
    await updateWishlistAnalytics(userId, wishlistId);

    return data;
  } catch (error) {
    console.error('Error in addWishlistItem:', error);
    return null;
  }
}

/**
 * Remove item from wishlist
 */
export async function removeWishlistItem(
  userId: string,
  wishlistId: string,
  itemId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId)
      .eq('wishlist_id', wishlistId);

    if (error) {
      console.error('Error removing wishlist item:', error);
      return false;
    }

    // Update wishlist analytics
    await updateWishlistAnalytics(userId, wishlistId);

    return true;
  } catch (error) {
    console.error('Error in removeWishlistItem:', error);
    return false;
  }
}

/**
 * Get wishlist with items
 */
export async function getWishlistWithItems(
  wishlistId: string
): Promise<WishlistWithItems | null> {
  try {
    const [wishlistRes, itemsRes] = await Promise.all([
      supabase.from('wishlists').select('*').eq('id', wishlistId).single(),
      supabase
        .from('wishlist_items')
        .select('*')
        .eq('wishlist_id', wishlistId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

    if (wishlistRes.error || !wishlistRes.data) {
      return null;
    }

    const items = itemsRes.data || [];
    const totalValue = items.reduce((sum, item) => sum + item.current_price, 0);

    return {
      ...wishlistRes.data,
      items,
      itemCount: items.length,
      totalValue,
    };
  } catch (error) {
    console.error('Error in getWishlistWithItems:', error);
    return null;
  }
}

/**
 * Get user's wishlists
 */
export async function getUserWishlists(
  userId: string,
  customerEmail: string
): Promise<WishlistWithItems[]> {
  try {
    const { data: wishlists, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlists:', error);
      return [];
    }

    // Fetch items for each wishlist
    const wishlistsWithItems = await Promise.all(
      (wishlists || []).map(async (wishlist) => {
        const { data: items } = await supabase
          .from('wishlist_items')
          .select('*')
          .eq('wishlist_id', wishlist.id);

        const itemList = items || [];
        const totalValue = itemList.reduce(
          (sum, item) => sum + item.current_price,
          0
        );

        return {
          ...wishlist,
          items: itemList,
          itemCount: itemList.length,
          totalValue,
        };
      })
    );

    return wishlistsWithItems;
  } catch (error) {
    console.error('Error in getUserWishlists:', error);
    return [];
  }
}

/**
 * Share wishlist
 */
export async function shareWishlist(
  userId: string,
  wishlistId: string,
  share: {
    shareEmail?: string;
    shareName?: string;
    shareType: string;
    expiresAt?: Date;
    canEdit?: boolean;
  }
): Promise<WishlistShare | null> {
  try {
    // Generate unique share token
    const shareToken = `wl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('wishlist_shares')
      .insert({
        user_id: userId,
        wishlist_id: wishlistId,
        share_email: share.shareEmail,
        share_name: share.shareName,
        share_token: shareToken,
        share_type: share.shareType,
        expires_at: share.expiresAt,
        can_edit: share.canEdit || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing wishlist:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in shareWishlist:', error);
    return null;
  }
}

/**
 * Get shared wishlist
 */
export async function getSharedWishlist(
  shareToken: string
): Promise<WishlistWithItems | null> {
  try {
    // Get share record
    const { data: shareData, error: shareError } = await supabase
      .from('wishlist_shares')
      .select('wishlist_id')
      .eq('share_token', shareToken)
      .single();

    if (shareError || !shareData) {
      return null;
    }

    // Check if share has expired
    const { data: share } = await supabase
      .from('wishlist_shares')
      .select('expires_at')
      .eq('share_token', shareToken)
      .single();

    if (share?.expires_at && new Date(share.expires_at) < new Date()) {
      return null; // Share expired
    }

    // Increment view count
    await supabase
      .from('wishlist_shares')
      .update({
        view_count: supabase.raw('view_count + 1'),
        accessed_at: new Date(),
      })
      .eq('share_token', shareToken);

    // Get wishlist with items
    return getWishlistWithItems(shareData.wishlist_id);
  } catch (error) {
    console.error('Error in getSharedWishlist:', error);
    return null;
  }
}

/**
 * Track price change
 */
export async function trackPriceChange(
  userId: string,
  wishlistItemId: string,
  newPrice: number
): Promise<WishlistPriceHistory | null> {
  try {
    // Get current item price
    const { data: item } = await supabase
      .from('wishlist_items')
      .select('current_price')
      .eq('id', wishlistItemId)
      .single();

    if (!item) {
      return null;
    }

    const oldPrice = item.current_price;
    const priceDropAmount = oldPrice - newPrice;
    const priceDropPercent = (priceDropAmount / oldPrice) * 100;

    // Record price change
    const { data, error } = await supabase
      .from('wishlist_price_history')
      .insert({
        user_id: userId,
        wishlist_item_id: wishlistItemId,
        old_price: oldPrice,
        new_price: newPrice,
        price_drop_amount: Math.max(0, priceDropAmount),
        price_drop_percent: priceDropPercent > 0 ? priceDropPercent : 0,
        price_checked_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking price change:', error);
      return null;
    }

    // Update item current price
    await supabase
      .from('wishlist_items')
      .update({
        current_price: newPrice,
        updated_at: new Date(),
      })
      .eq('id', wishlistItemId);

    return data;
  } catch (error) {
    console.error('Error in trackPriceChange:', error);
    return null;
  }
}

/**
 * Get price history for item
 */
export async function getItemPriceHistory(
  wishlistItemId: string
): Promise<WishlistPriceHistory[]> {
  try {
    const { data, error } = await supabase
      .from('wishlist_price_history')
      .select('*')
      .eq('wishlist_item_id', wishlistItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching price history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getItemPriceHistory:', error);
    return [];
  }
}

/**
 * Update wishlist preferences
 */
export async function updateWishlistPreferences(
  userId: string,
  customerEmail: string,
  preferences: Partial<WishlistPreferences>
): Promise<WishlistPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('wishlist_preferences')
      .upsert({
        user_id: userId,
        customer_email: customerEmail,
        notify_price_drops: preferences.notifyPriceDrops ?? true,
        price_drop_threshold: preferences.priceDropThreshold ?? 10,
        notify_back_in_stock: preferences.notifyBackInStock ?? true,
        notify_shared_wishlists: preferences.notifySharedWishlists ?? true,
        weekly_digest: preferences.weeklyDigest ?? false,
        default_wishlist_visibility: preferences.defaultWishlistVisibility ?? 'private',
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateWishlistPreferences:', error);
    return null;
  }
}

/**
 * Get wishlist preferences
 */
export async function getWishlistPreferences(
  customerEmail: string
): Promise<WishlistPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('wishlist_preferences')
      .select('*')
      .eq('customer_email', customerEmail)
      .single();

    if (error) {
      // Return defaults if not found
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getWishlistPreferences:', error);
    return null;
  }
}

/**
 * Update wishlist analytics
 */
export async function updateWishlistAnalytics(
  userId: string,
  wishlistId: string
): Promise<WishlistAnalytics | null> {
  try {
    // Get wishlist items
    const { data: items } = await supabase
      .from('wishlist_items')
      .select('current_price')
      .eq('wishlist_id', wishlistId);

    const itemList = items || [];
    const totalValue = itemList.reduce((sum, item) => sum + item.current_price, 0);
    const averagePrice = itemList.length > 0 ? totalValue / itemList.length : 0;

    // Get share count
    const { count: shareCount } = await supabase
      .from('wishlist_shares')
      .select('id', { count: 'exact' })
      .eq('wishlist_id', wishlistId);

    // Record analytics
    const { data, error } = await supabase
      .from('wishlist_analytics')
      .insert({
        user_id: userId,
        wishlist_id: wishlistId,
        date: new Date(),
        total_items: itemList.length,
        total_value: totalValue,
        average_price: averagePrice,
        share_count: shareCount || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateWishlistAnalytics:', error);
    return null;
  }
}

/**
 * Get wishlist analytics
 */
export async function getWishlistAnalytics(
  wishlistId: string,
  days: number = 30
): Promise<WishlistAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('wishlist_analytics')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getWishlistAnalytics:', error);
    return [];
  }
}

/**
 * Update wishlist visibility
 */
export async function updateWishlistVisibility(
  wishlistId: string,
  isPublic: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .update({
        is_public: isPublic,
        updated_at: new Date(),
      })
      .eq('id', wishlistId);

    if (error) {
      console.error('Error updating visibility:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWishlistVisibility:', error);
    return false;
  }
}

/**
 * Delete wishlist
 */
export async function deleteWishlist(wishlistId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId);

    if (error) {
      console.error('Error deleting wishlist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWishlist:', error);
    return false;
  }
}
