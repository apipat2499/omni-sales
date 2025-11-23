import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Parse and validate request JSON body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string[]> = {};

      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(error.message);
      });

      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: result.data as T,
    };
  } catch (error) {
    return {
      success: false,
      errors: {
        body: ['Invalid JSON in request body'],
      },
    };
  }
}

/**
 * Create a 400 error response for validation errors
 */
export function validationErrorResponse(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  );
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema
): ValidationResult<T> {
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const values = searchParams.getAll(key);
    if (values.length === 1) {
      params[key] = value;
    } else {
      params[key] = values;
    }
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const errors: Record<string, string[]> = {};

    result.error.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    });

    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: result.data as T,
  };
}
