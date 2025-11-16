/**
 * PriceSimulator Component
 * Test pricing scenarios and see price breakdowns
 */

'use client';

import React, { useState, useMemo } from 'react';
import { usePricingRules } from '@/lib/hooks/usePricingRules';
import { useCouponManagement } from '@/lib/hooks/useCouponManagement';
import type { OrderItem, Customer } from '@/types';

interface PriceSimulatorProps {
  className?: string;
}

export default function PriceSimulator({ className = '' }: PriceSimulatorProps) {
  const { calculatePrice, getApplicableRules, activeRules } = usePricingRules();
  const { validateCoupon, activeCoupons } = useCouponManagement();

  // Mock data
  const mockProducts = [
    { id: 'prod_1', name: 'Laptop', price: 999 },
    { id: 'prod_2', name: 'Mouse', price: 29.99 },
    { id: 'prod_3', name: 'Keyboard', price: 79.99 },
    { id: 'prod_4', name: 'Monitor', price: 299 },
    { id: 'prod_5', name: 'Headphones', price: 149 },
  ];

  const mockCustomers: Customer[] = [
    {
      id: 'cust_1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      totalOrders: 25,
      totalSpent: 5000,
      tags: ['vip'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
    },
    {
      id: 'cust_2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '098-765-4321',
      totalOrders: 5,
      totalSpent: 500,
      tags: ['regular'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
    {
      id: 'cust_3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '555-555-5555',
      totalOrders: 0,
      totalSpent: 0,
      tags: ['new'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(mockCustomers[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupons, setAppliedCoupons] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonScenarios, setComparisonScenarios] = useState<any[]>([]);

  /**
   * Create order item from selections
   */
  const orderItem: OrderItem = useMemo(
    () => ({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      price: selectedProduct.price,
    }),
    [selectedProduct, quantity]
  );

  /**
   * Calculate price
   */
  const priceCalculation = useMemo(() => {
    return calculatePrice(orderItem, selectedCustomer, new Date(selectedDate), appliedCoupons);
  }, [orderItem, selectedCustomer, selectedDate, appliedCoupons, calculatePrice]);

  /**
   * Get applicable rules
   */
  const applicableRules = useMemo(() => {
    return getApplicableRules(orderItem, selectedCustomer, new Date(selectedDate));
  }, [orderItem, selectedCustomer, selectedDate, getApplicableRules]);

  /**
   * Handle apply coupon
   */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    const validation = await validateCoupon(
      couponCode,
      [orderItem],
      selectedCustomer,
      priceCalculation.subtotal
    );

    if (validation.valid) {
      setAppliedCoupons([...appliedCoupons, couponCode]);
      setCouponCode('');
    } else {
      alert(validation.error || 'Invalid coupon');
    }
  };

  /**
   * Remove coupon
   */
  const handleRemoveCoupon = (code: string) => {
    setAppliedCoupons(appliedCoupons.filter((c) => c !== code));
  };

  /**
   * Add to comparison
   */
  const handleAddToComparison = () => {
    setComparisonScenarios([
      ...comparisonScenarios,
      {
        id: Date.now(),
        product: selectedProduct,
        quantity,
        customer: selectedCustomer,
        calculation: priceCalculation,
      },
    ]);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Price Simulator</h2>
            <p className="text-sm text-gray-600 mt-1">
              Test pricing scenarios and see real-time calculations
            </p>
          </div>
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`px-4 py-2 rounded-lg ${
              comparisonMode
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Comparison Mode {comparisonMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Active Rules Count */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">{activeRules.length}</span> active pricing rules •{' '}
            <span className="font-semibold">{activeCoupons.length}</span> active coupons
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Scenario</h3>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              value={selectedProduct.id}
              onChange={(e) =>
                setSelectedProduct(mockProducts.find((p) => p.id === e.target.value)!)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {mockProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={selectedCustomer.id}
              onChange={(e) =>
                setSelectedCustomer(mockCustomers.find((c) => c.id === e.target.value)!)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {mockCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.tags[0]} ({customer.totalOrders} orders)
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Coupon Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apply Coupon</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter coupon code"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Apply
              </button>
            </div>
            {appliedCoupons.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {appliedCoupons.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {code}
                    <button
                      onClick={() => handleRemoveCoupon(code)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {comparisonMode && (
            <button
              onClick={handleAddToComparison}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add to Comparison
            </button>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Price Calculation</h3>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-semibold text-gray-900">
                ${priceCalculation.basePrice.toFixed(2)} × {priceCalculation.quantity}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                ${priceCalculation.subtotal.toFixed(2)}
              </span>
            </div>

            {priceCalculation.discounts.length > 0 && (
              <>
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Discounts Applied:</div>
                  {priceCalculation.discounts.map((discount, index) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span className="text-green-600">
                        {discount.ruleName}
                        {discount.percentage && ` (${discount.percentage}%)`}:
                      </span>
                      <span className="font-semibold text-green-600">
                        -${discount.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Savings:</span>
                  <span className="font-semibold text-green-600">
                    -${priceCalculation.totalSavings.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <div className="border-t border-gray-300 pt-3 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Final Price:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${priceCalculation.finalPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Price per unit:</span>
              <span>${priceCalculation.finalPricePerUnit.toFixed(2)}</span>
            </div>

            {priceCalculation.loyaltyPoints > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                <span className="text-yellow-800">
                  +{priceCalculation.loyaltyPoints} Loyalty Points
                </span>
              </div>
            )}
          </div>

          {/* Applicable Rules */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Applicable Rules ({applicableRules.length})
            </h4>
            {applicableRules.length > 0 ? (
              <div className="space-y-2">
                {applicableRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-white border border-gray-200 rounded p-3 text-sm"
                  >
                    <div className="font-semibold text-gray-900">{rule.name}</div>
                    <div className="text-gray-600 text-xs mt-1">{rule.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        Priority: {rule.priority}
                      </span>
                      {rule.isStackable && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                          Stackable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No rules apply to this scenario</p>
            )}
          </div>

          {/* Price Breakdown Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Detailed Breakdown</h4>
            <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono">
              {priceCalculation.breakdown}
            </pre>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      {comparisonMode && comparisonScenarios.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Scenario Comparison ({comparisonScenarios.length})
            </h3>
            <button
              onClick={() => setComparisonScenarios([])}
              className="text-sm text-red-600 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">Base</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">Discounts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">Final</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">Savings</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonScenarios.map((scenario) => (
                  <tr key={scenario.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{scenario.product.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{scenario.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {scenario.customer.name}
                      <span className="ml-1 text-xs text-gray-500">
                        ({scenario.customer.tags[0]})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ${scenario.calculation.subtotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {scenario.calculation.discounts.length > 0
                        ? `-$${scenario.calculation.totalSavings.toFixed(2)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                      ${scenario.calculation.finalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {scenario.calculation.subtotal > 0
                        ? `${((scenario.calculation.totalSavings / scenario.calculation.subtotal) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setComparisonScenarios(
                            comparisonScenarios.filter((s) => s.id !== scenario.id)
                          )
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comparison Summary */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Best Deal</div>
              <div className="text-lg font-bold text-blue-600">
                {comparisonScenarios.length > 0
                  ? `$${Math.min(...comparisonScenarios.map((s) => s.calculation.finalPrice)).toFixed(2)}`
                  : '-'}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Max Savings</div>
              <div className="text-lg font-bold text-green-600">
                {comparisonScenarios.length > 0
                  ? `$${Math.max(...comparisonScenarios.map((s) => s.calculation.totalSavings)).toFixed(2)}`
                  : '-'}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Average Price</div>
              <div className="text-lg font-bold text-purple-600">
                {comparisonScenarios.length > 0
                  ? `$${(comparisonScenarios.reduce((sum, s) => sum + s.calculation.finalPrice, 0) / comparisonScenarios.length).toFixed(2)}`
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
