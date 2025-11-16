import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Text, Chip, IconButton } from 'react-native-paper';
import { Card, LoadingSpinner, ErrorMessage, Button } from '../components';
import { apiClient } from '../lib/api/client';
import { API_ENDPOINTS } from '../lib/api/endpoints';
import { Product } from '../types';

const { width } = Dimensions.get('window');

interface ProductDetailScreenProps {
  route: {
    params: {
      productId: string;
    };
  };
  navigation: any;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.get<Product>(
        API_ENDPOINTS.PRODUCTS.DETAIL(productId),
        {},
        { key: `product_${productId}`, ttl: 10 * 60 * 1000 }
      );
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading product..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadProduct} />;
  }

  if (!product) {
    return <ErrorMessage message="Product not found" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'out_of_stock':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {product.images && product.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[selectedImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {product.images.length > 1 && (
            <ScrollView
              horizontal
              style={styles.thumbnailScroll}
              showsHorizontalScrollIndicator={false}
            >
              {product.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.thumbnailSelected,
                  ]}
                  onTouchEnd={() => setSelectedImageIndex(index)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{product.name}</Text>
          <Chip
            style={{ backgroundColor: getStatusColor(product.status) }}
            textStyle={{ color: '#fff' }}
          >
            {product.status.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>

        <Text style={styles.price}>
          {product.currency} {product.price.toFixed(2)}
        </Text>

        {product.sku && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>SKU:</Text>
            <Text style={styles.value}>{product.sku}</Text>
          </View>
        )}

        {product.barcode && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Barcode:</Text>
            <Text style={styles.value}>{product.barcode}</Text>
          </View>
        )}

        {product.category && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>{product.category}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Stock:</Text>
          <Text
            style={[
              styles.value,
              product.stockQuantity === 0 && { color: '#f44336' },
            ]}
          >
            {product.stockQuantity} units
          </Text>
        </View>

        {product.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('QRScanner', { productId: product.id })}
            icon="qrcode-scan"
            style={styles.actionButton}
          >
            Scan Barcode
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Camera', { productId: product.id })}
            icon="camera"
            style={styles.actionButton}
          >
            Take Photo
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '100%',
  },
  mainImage: {
    width: width,
    height: width,
  },
  thumbnailScroll: {
    padding: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: '#6200ee',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    width: 100,
    color: '#666',
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  descriptionSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  actions: {
    marginTop: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
});
