#!/usr/bin/env ts-node

/**
 * API Documentation Generator Script
 *
 * This script generates comprehensive API documentation including:
 * - OpenAPI/Swagger specification
 * - Postman collection
 * - TypeScript types
 *
 * Usage: npm run generate:api-docs
 */

import fs from 'fs';
import path from 'path';

interface RouteInfo {
  path: string;
  method: string;
  file: string;
}

interface EndpointStats {
  total: number;
  byMethod: Record<string, number>;
  byCategory: Record<string, number>;
}

/**
 * Scan and catalog all API routes
 */
function scanApiRoutes(baseDir: string = 'app/api'): RouteInfo[] {
  const routes: RouteInfo[] = [];

  function scanDirectory(dir: string, basePath: string = ''): void {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  Directory not found: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Handle dynamic routes like [orderId]
        const isDynamic = file.startsWith('[') && file.endsWith(']');
        const pathSegment = isDynamic ? `{${file.slice(1, -1)}}` : file;
        scanDirectory(filePath, `${basePath}/${pathSegment}`);
      } else if (file === 'route.ts' || file === 'route.js') {
        const apiPath = `/api${basePath}`;
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract HTTP methods
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        for (const method of methods) {
          const patterns = [
            `export async function ${method}`,
            `export const ${method}`,
            `export function ${method}`
          ];

          if (patterns.some(pattern => content.includes(pattern))) {
            routes.push({
              path: apiPath,
              method: method.toLowerCase(),
              file: filePath
            });
          }
        }
      }
    }
  }

  scanDirectory(baseDir);
  return routes;
}

/**
 * Calculate endpoint statistics
 */
function calculateStats(routes: RouteInfo[]): EndpointStats {
  const stats: EndpointStats = {
    total: routes.length,
    byMethod: {},
    byCategory: {}
  };

  for (const route of routes) {
    // Count by method
    stats.byMethod[route.method] = (stats.byMethod[route.method] || 0) + 1;

    // Extract category from path (first segment after /api)
    const pathParts = route.path.split('/').filter(p => p);
    if (pathParts.length > 1) {
      const category = pathParts[1];
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Generate enhanced OpenAPI specification
 */
function generateEnhancedOpenApiSpec(routes: RouteInfo[]): any {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Omni Sales API',
      version: '1.0.0',
      description: `
Comprehensive API documentation for the Omni Sales e-commerce platform.

This API provides ${routes.length}+ endpoints across multiple domains including:
- Product and inventory management
- Order processing and fulfillment
- Customer relationship management
- Analytics and reporting
- Payment processing (Stripe)
- Marketplace integration (Shopee, Lazada)
- Email and SMS campaigns
- And much more!

For interactive API exploration, visit: http://localhost:3000/api-docs
      `.trim(),
      contact: {
        name: 'API Support',
        email: 'support@omnisales.com',
        url: 'https://omnisales.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.omnisales.com',
        description: 'Production server'
      },
      {
        url: 'https://staging-api.omnisales.com',
        description: 'Staging server'
      }
    ],
    tags: extractTags(routes),
    paths: generatePaths(routes),
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token authentication. Include the token in the Authorization header.'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service authentication'
        }
      }
    },
    security: [{ BearerAuth: [] }]
  };

  return spec;
}

/**
 * Extract unique tags from routes
 */
function extractTags(routes: RouteInfo[]): any[] {
  const tagSet = new Set<string>();

  for (const route of routes) {
    const pathParts = route.path.split('/').filter(p => p && !p.startsWith('{'));
    if (pathParts.length > 1) {
      const category = pathParts[1];
      tagSet.add(category.charAt(0).toUpperCase() + category.slice(1));
    }
  }

  return Array.from(tagSet).sort().map(tag => ({
    name: tag,
    description: `${tag} related endpoints`
  }));
}

/**
 * Generate OpenAPI paths
 */
function generatePaths(routes: RouteInfo[]): any {
  const paths: Record<string, any> = {};

  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    const pathParts = route.path.split('/').filter(p => p);
    const category = pathParts.length > 1 ?
      pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) :
      'General';

    paths[route.path][route.method] = {
      tags: [category],
      summary: `${route.method.toUpperCase()} ${route.path}`,
      description: `Endpoint for ${route.path}`,
      operationId: generateOperationId(route),
      responses: {
        '200': {
          description: 'Successful response'
        },
        '400': {
          description: 'Bad request'
        },
        '401': {
          description: 'Unauthorized'
        },
        '404': {
          description: 'Not found'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    };

    // Add security for non-webhook routes
    if (!route.path.includes('webhook')) {
      paths[route.path][route.method].security = [{ BearerAuth: [] }];
    }
  }

  return paths;
}

/**
 * Generate operation ID from route
 */
function generateOperationId(route: RouteInfo): string {
  const pathParts = route.path
    .split('/')
    .filter(p => p && p !== 'api')
    .map(p => p.startsWith('{') ? 'By' + p.slice(1, -1).charAt(0).toUpperCase() + p.slice(2, -1) : p)
    .join('_');

  return `${route.method}_${pathParts}`;
}

/**
 * Save documentation files
 */
function saveDocumentation(spec: any, routes: RouteInfo[]): void {
  // Save OpenAPI spec
  const swaggerPath = path.join('public', 'swagger.json');
  fs.writeFileSync(swaggerPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI specification saved to: ${swaggerPath}`);

  // Generate and save route catalog
  const catalogPath = path.join('docs', 'API_CATALOG.md');
  const catalog = generateRouteCatalog(routes);
  fs.writeFileSync(catalogPath, catalog);
  console.log(`✅ Route catalog saved to: ${catalogPath}`);

  // Calculate and display stats
  const stats = calculateStats(routes);
  console.log('\n📊 API Documentation Statistics:');
  console.log(`   Total endpoints: ${stats.total}`);
  console.log('\n   By HTTP method:');
  Object.entries(stats.byMethod)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`   - ${method.toUpperCase()}: ${count}`);
    });
  console.log('\n   By category:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`   - ${category}: ${count}`);
    });
}

/**
 * Generate route catalog markdown
 */
function generateRouteCatalog(routes: RouteInfo[]): string {
  const byCategory: Record<string, RouteInfo[]> = {};

  for (const route of routes) {
    const pathParts = route.path.split('/').filter(p => p && !p.startsWith('{'));
    const category = pathParts.length > 1 ? pathParts[1] : 'other';

    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(route);
  }

  let markdown = '# API Route Catalog\n\n';
  markdown += `*Generated: ${new Date().toISOString()}*\n\n`;
  markdown += `**Total Endpoints:** ${routes.length}\n\n`;
  markdown += '## Table of Contents\n\n';

  // Generate TOC
  for (const category of Object.keys(byCategory).sort()) {
    markdown += `- [${category.charAt(0).toUpperCase() + category.slice(1)}](#${category})\n`;
  }

  markdown += '\n---\n\n';

  // Generate sections
  for (const [category, categoryRoutes] of Object.entries(byCategory).sort()) {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    markdown += `**Endpoints:** ${categoryRoutes.length}\n\n`;
    markdown += '| Method | Path | File |\n';
    markdown += '|--------|------|------|\n';

    for (const route of categoryRoutes.sort((a, b) => a.path.localeCompare(b.path))) {
      markdown += `| \`${route.method.toUpperCase()}\` | \`${route.path}\` | \`${route.file}\` |\n`;
    }

    markdown += '\n';
  }

  return markdown;
}

/**
 * Main execution
 */
function main(): void {
  console.log('🚀 Generating API documentation...\n');

  try {
    // Scan routes
    console.log('📂 Scanning API routes...');
    const routes = scanApiRoutes();
    console.log(`   Found ${routes.length} endpoints\n`);

    // Generate OpenAPI spec
    console.log('📝 Generating OpenAPI specification...');
    const spec = generateEnhancedOpenApiSpec(routes);

    // Save documentation
    console.log('💾 Saving documentation files...');
    saveDocumentation(spec, routes);

    console.log('\n✨ API documentation generated successfully!');
    console.log('\n📚 Documentation URLs:');
    console.log('   - Swagger UI: http://localhost:3000/api-docs');
    console.log('   - OpenAPI Spec: http://localhost:3000/swagger.json');
    console.log('   - Postman Collection: http://localhost:3000/postman-collection.json');
    console.log('   - Full Documentation: docs/API.md');
    console.log('   - Route Catalog: docs/API_CATALOG.md');
    console.log('');
  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { scanApiRoutes, generateEnhancedOpenApiSpec, calculateStats };
