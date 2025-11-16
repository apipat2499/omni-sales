import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Chip, Divider } from 'react-native-paper';
import { Card, LoadingSpinner, ErrorMessage } from '../components';
import { apiClient } from '../lib/api/client';
import { API_ENDPOINTS } from '../lib/api/endpoints';
import { Order } from '../types';
import { format } from 'date-fns';

interface OrderDetailScreenProps {
  route: {
    params: {
      orderId: string;
    };
  };
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.get<Order>(
        API_ENDPOINTS.ORDERS.DETAIL(orderId),
        {},
        { key: `order_${orderId}`, ttl: 5 * 60 * 1000 }
      );
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading order..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadOrder} />;
  }

  if (!order) {
    return <ErrorMessage message="Order not found" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
      case 'shipped':
        return '#2196F3';
      case 'processing':
        return '#FF9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.date}>
                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
              </Text>
            </View>
            <Chip
              style={{ backgroundColor: getStatusColor(order.status) }}
              textStyle={{ color: '#fff' }}
            >
              {order.status.toUpperCase()}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <Text style={styles.text}>{order.customerName}</Text>
          </View>

          {order.shippingAddress && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <Text style={styles.text}>{order.shippingAddress.street}</Text>
              <Text style={styles.text}>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </Text>
              <Text style={styles.text}>{order.shippingAddress.country}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <Divider style={styles.itemDivider} />}
              <View style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemDetails}>
                    Qty: {item.quantity} × {order.currency} {item.price.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {order.currency} {item.total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {order.currency} {order.total.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDivider: {
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
