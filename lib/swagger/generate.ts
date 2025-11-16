/**
 * OpenAPI Documentation Generator
 *
 * This script automatically generates OpenAPI documentation from API routes
 * Run with: npm run generate:api-docs
 */

import fs from 'fs';
import path from 'path';
import { schemas, securitySchemes, parameters, responses } from './schemas';

interface RouteInfo {
  path: string;
  method: string;
  handler: string;
}

/**
 * Scan API routes directory and extract route information
 */
export function scanApiRoutes(baseDir: string = 'app/api'): RouteInfo[] {
  const routes: RouteInfo[] = [];

  function scanDirectory(dir: string, basePath: string = '') {
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
        // This is an API route file
        const apiPath = `/api${basePath}`;
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract HTTP methods from the file
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        for (const method of methods) {
          if (content.includes(`export async function ${method}`) ||
              content.includes(`export const ${method}`)) {
            routes.push({
              path: apiPath,
              method: method.toLowerCase(),
              handler: filePath
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
 * Generate OpenAPI paths from route information
 */
export function generateOpenApiPaths(routes: RouteInfo[]) {
  const paths: Record<string, any> = {};

  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    // Basic operation object
    paths[route.path][route.method] = {
      summary: `${route.method.toUpperCase()} ${route.path}`,
      description: `Endpoint for ${route.path}`,
      responses: {
        '200': {
          description: 'Successful response'
        },
        '500': {
          $ref: '#/components/responses/ServerError'
        }
      }
    };

    // Add authentication for most routes
    if (!route.path.includes('/webhook')) {
      paths[route.path][route.method].security = [{ BearerAuth: [] }];
    }
  }

  return paths;
}

/**
 * Generate complete OpenAPI specification
 */
export function generateOpenApiSpec() {
  const routes = scanApiRoutes();
  const paths = generateOpenApiPaths(routes);

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Omni Sales API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Omni Sales e-commerce platform',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.omnisales.com',
        description: 'Production server'
      }
    ],
    paths,
    components: {
      schemas,
      securitySchemes,
      parameters,
      responses
    },
    security: [{ BearerAuth: [] }]
  };

  return spec;
}

/**
 * Save OpenAPI spec to file
 */
export function saveOpenApiSpec(outputPath: string = 'public/swagger.json') {
  const spec = generateOpenApiSpec();
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI specification generated at: ${outputPath}`);
  console.log(`📊 Total endpoints: ${Object.keys(spec.paths).length}`);
}

/**
 * Generate TypeScript types from OpenAPI spec
 */
export function generateTypeScriptTypes(spec: any): string {
  let output = '/**\n * Auto-generated TypeScript types from OpenAPI spec\n */\n\n';

  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    output += `export interface ${name} {\n`;
    const props = (schema as any).properties || {};
    for (const [propName, propSchema] of Object.entries(props)) {
      const type = (propSchema as any).type || 'any';
      const tsType = type === 'integer' ? 'number' : type;
      const required = (schema as any).required?.includes(propName);
      output += `  ${propName}${required ? '' : '?'}: ${tsType};\n`;
    }
    output += '}\n\n';
  }

  return output;
}

// Run if executed directly
if (require.main === module) {
  saveOpenApiSpec();
}
