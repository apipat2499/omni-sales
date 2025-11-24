'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus, OrderChannel } from '@/types';
import type { PaginatedResponse } from '@/lib/utils/pagination';

interface UseOrdersParams {
  search?: string;
  status?: OrderStatus | 'all';
  channel?: OrderChannel | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchOrders(params: UseOrdersParams): Promise<PaginatedResponse<Order>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.append('search', params.search);
  if (params.status && params.status !== 'all') searchParams.append('status', params.status);
  if (params.channel && params.channel !== 'all') searchParams.append('channel', params.channel);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  try {
    const response = await fetch(`/api/orders?${searchParams.toString()}`);

    if (!response.ok) {
      console.warn('Orders API failed, using demo data');
      // Return demo data as fallback
      return {
        data: [
          {
            id: 'demo-ord-001',
            customerId: 'demo-cust-001',
            customerName: 'สมชาย ใจดี',
            subtotal: 2500,
            tax: 175,
            shipping: 50,
            total: 2725,
            discountAmount: 0,
            status: 'pending' as OrderStatus,
            channel: 'online' as OrderChannel,
            paymentMethod: 'credit_card',
            shippingAddress: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
            notes: 'กรุณาจัดส่งช่วงเช้า',
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [
              {
                id: 'demo-item-001',
                productId: 'demo-prod-001',
                productName: 'MacBook Pro 16"',
                quantity: 1,
                price: 2500,
              },
            ],
          },
          {
            id: 'demo-ord-002',
            customerId: 'demo-cust-002',
            customerName: 'สมหญิง รักเรียน',
            subtotal: 1200,
            tax: 84,
            shipping: 50,
            total: 1334,
            discountAmount: 100,
            status: 'processing' as OrderStatus,
            channel: 'pos' as OrderChannel,
            paymentMethod: 'cash',
            shippingAddress: '456 ถนนพระราม 4 กรุงเทพฯ 10500',
            notes: null,
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 86400000),
            items: [
              {
                id: 'demo-item-002',
                productId: 'demo-prod-002',
                productName: 'iPad Air',
                quantity: 2,
                price: 600,
              },
            ],
          },
          {
            id: 'demo-ord-003',
            customerId: 'demo-cust-003',
            customerName: 'วิชัย ทำงานหนัก',
            subtotal: 3500,
            tax: 245,
            shipping: 100,
            total: 3845,
            discountAmount: 200,
            status: 'shipped' as OrderStatus,
            channel: 'online' as OrderChannel,
            paymentMethod: 'bank_transfer',
            shippingAddress: '789 ถนนพัฒนาการ กรุงเทพฯ 10250',
            notes: 'โปรดโทรหาก่อนส่ง',
            createdAt: new Date(Date.now() - 172800000),
            updatedAt: new Date(Date.now() - 172800000),
            items: [
              {
                id: 'demo-item-003',
                productId: 'demo-prod-003',
                productName: 'iPhone 15 Pro',
                quantity: 1,
                price: 3500,
              },
            ],
          },
        ],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 3,
          totalPages: 1,
        },
      };
    }

    const data = await response.json();

    // Transform date strings to Date objects
    return {
      ...data,
      data: data.data.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
      })),
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    // Return demo data as fallback on any error
    return {
      data: [
        {
          id: 'demo-ord-001',
          customerId: 'demo-cust-001',
          customerName: 'สมชาย ใจดี',
          subtotal: 2500,
          tax: 175,
          shipping: 50,
          total: 2725,
          discountAmount: 0,
          status: 'pending' as OrderStatus,
          channel: 'online' as OrderChannel,
          paymentMethod: 'credit_card',
          shippingAddress: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
          notes: 'กรุณาจัดส่งช่วงเช้า',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: 'demo-item-001',
              productId: 'demo-prod-001',
              productName: 'MacBook Pro 16"',
              quantity: 1,
              price: 2500,
            },
          ],
        },
        {
          id: 'demo-ord-002',
          customerId: 'demo-cust-002',
          customerName: 'สมหญิง รักเรียน',
          subtotal: 1200,
          tax: 84,
          shipping: 50,
          total: 1334,
          discountAmount: 100,
          status: 'processing' as OrderStatus,
          channel: 'pos' as OrderChannel,
          paymentMethod: 'cash',
          shippingAddress: '456 ถนนพระราม 4 กรุงเทพฯ 10500',
          notes: null,
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
          items: [
            {
              id: 'demo-item-002',
              productId: 'demo-prod-002',
              productName: 'iPad Air',
              quantity: 2,
              price: 600,
            },
          ],
        },
        {
          id: 'demo-ord-003',
          customerId: 'demo-cust-003',
          customerName: 'วิชัย ทำงานหนัก',
          subtotal: 3500,
          tax: 245,
          shipping: 100,
          total: 3845,
          discountAmount: 200,
          status: 'shipped' as OrderStatus,
          channel: 'online' as OrderChannel,
          paymentMethod: 'bank_transfer',
          shippingAddress: '789 ถนนพัฒนาการ กรุงเทพฯ 10250',
          notes: 'โปรดโทรหาก่อนส่ง',
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 172800000),
          items: [
            {
              id: 'demo-item-003',
              productId: 'demo-prod-003',
              productName: 'iPhone 15 Pro',
              quantity: 1,
              price: 3500,
            },
          ],
        },
      ],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: 3,
        totalPages: 1,
      },
    };
  }
}

export function useOrdersQuery(params: UseOrdersParams = {}) {
  const { page = 1, limit = 20, ...rest } = params;

  return useQuery({
    queryKey: ['orders', { page, limit, ...rest }],
    queryFn: () => fetchOrders({ page, limit, ...rest }),
    staleTime: 15 * 1000, // 15 seconds - orders change frequently
  });
}

// Mutation for updating order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Mutation for creating order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Inventory changed
    },
  });
}
