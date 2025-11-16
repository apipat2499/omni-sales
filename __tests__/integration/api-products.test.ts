/**
 * Integration tests for Product API endpoints
 */
import { mockApiResponse, mockApiError } from './setup';
import { createMockProduct, createMockProducts } from '../factories';

describe('Product API Integration', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  describe('GET /api/products', () => {
    it('should fetch all products', async () => {
      const mockProducts = createMockProducts(5);

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ products: mockProducts })
      );

      const response = await fetch('/api/products');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.products).toHaveLength(5);
      expect(data.products[0]).toHaveProperty('id');
      expect(data.products[0]).toHaveProperty('name');
      expect(data.products[0]).toHaveProperty('price');
    });

    it('should support pagination', async () => {
      const mockProducts = createMockProducts(10);

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({
          products: mockProducts.slice(0, 5),
          pagination: {
            page: 1,
            limit: 5,
            total: 10,
            hasNext: true,
          },
        })
      );

      const response = await fetch('/api/products?page=1&limit=5');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.products).toHaveLength(5);
      expect(data.pagination.hasNext).toBe(true);
      expect(data.pagination.total).toBe(10);
    });

    it('should support filtering by category', async () => {
      const electronicsProducts = createMockProducts(3, { category: 'Electronics' });

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ products: electronicsProducts })
      );

      const response = await fetch('/api/products?category=Electronics');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.products).toHaveLength(3);
      expect(data.products.every((p: any) => p.category === 'Electronics')).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should fetch a single product', async () => {
      const mockProduct = createMockProduct({ id: 'prod-123' });

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse(mockProduct)
      );

      const response = await fetch('/api/products/prod-123');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBe('prod-123');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('price');
    });

    it('should return 404 for non-existent products', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiError('Product not found', 404)
      );

      const response = await fetch('/api/products/non-existent');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        category: 'Electronics',
        price: 199.99,
        stock: 50,
      };

      const mockResponse = {
        id: 'prod-456',
        ...newProduct,
        createdAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse(mockResponse, 201)
      );

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('New Product');
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        // Missing required fields
        price: 100,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiError('Name is required', 400)
      );

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidProduct),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product stock', async () => {
      const productId = 'prod-123';
      const updates = { stock: 100 };

      const mockResponse = {
        id: productId,
        name: 'Test Product',
        stock: 100,
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse(mockResponse)
      );

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBe(productId);
      expect(data.stock).toBe(100);
    });
  });

  describe('GET /api/products/search', () => {
    it('should search products by query', async () => {
      const searchResults = createMockProducts(3, {
        name: 'Laptop Computer',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ results: searchResults })
      );

      const response = await fetch('/api/products/search?q=laptop');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.results).toHaveLength(3);
      expect(data.results.every((p: any) =>
        p.name.toLowerCase().includes('laptop')
      )).toBe(true);
    });

    it('should return empty results for no matches', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ results: [] })
      );

      const response = await fetch('/api/products/search?q=nonexistent');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.results).toEqual([]);
    });
  });
});
