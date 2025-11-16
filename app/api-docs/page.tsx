'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the OpenAPI spec
    fetch('/swagger.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load API specification');
        }
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Documentation</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Omni Sales API Documentation</h1>
          <p className="text-blue-100">
            Comprehensive REST API documentation for the Omni Sales platform
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <span className="bg-blue-500 px-3 py-1 rounded">
              Version: {spec?.info?.version || '1.0.0'}
            </span>
            <span className="bg-blue-500 px-3 py-1 rounded">
              Total Endpoints: {Object.keys(spec?.paths || {}).length}
            </span>
          </div>
        </div>
      </header>

      {/* Quick Links */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Quick Links:</h2>
          <div className="flex flex-wrap gap-2">
            <a
              href="#/Products"
              className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Products
            </a>
            <a
              href="#/Orders"
              className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Orders
            </a>
            <a
              href="#/Customers"
              className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Customers
            </a>
            <a
              href="#/Analytics"
              className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Analytics
            </a>
            <a
              href="#/Payments"
              className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Payments
            </a>
            <a
              href="#/Marketplace"
              className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Marketplace
            </a>
            <a
              href="#/Inventory"
              className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Inventory
            </a>
            <a
              href="/postman-collection.json"
              download
              className="text-sm bg-purple-600 text-white rounded px-3 py-1 hover:bg-purple-700 transition-colors"
            >
              Download Postman Collection
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto">
        <SwaggerUI
          spec={spec}
          deepLinking={true}
          displayRequestDuration={true}
          tryItOutEnabled={true}
          persistAuthorization={true}
          filter={true}
          defaultModelsExpandDepth={2}
          defaultModelExpandDepth={2}
          docExpansion="list"
        />
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Getting Started</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="/docs/API.md" className="hover:text-blue-600">
                    Full API Documentation
                  </a>
                </li>
                <li>
                  <a href="#authentication" className="hover:text-blue-600">
                    Authentication Guide
                  </a>
                </li>
                <li>
                  <a href="#rate-limiting" className="hover:text-blue-600">
                    Rate Limiting
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="/swagger.json" className="hover:text-blue-600">
                    OpenAPI Spec (JSON)
                  </a>
                </li>
                <li>
                  <a href="/postman-collection.json" className="hover:text-blue-600">
                    Postman Collection
                  </a>
                </li>
                <li>
                  <a href="#code-examples" className="hover:text-blue-600">
                    Code Examples
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>API Version: {spec?.info?.version || '1.0.0'}</li>
                <li>
                  <a href="mailto:support@omnisales.com" className="hover:text-blue-600">
                    support@omnisales.com
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Report an Issue
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Omni Sales. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
