/**
 * API response utility functions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Create a successful API response
 */
export const successResponse = <T>(data: T): ApiResponse<T> => {
  return {
    success: true,
    data
  };
};

/**
 * Create an error API response
 */
export const errorResponse = (message: string, code?: string): ApiResponse => {
  return {
    success: false,
    error: {
      message,
      code
    }
  };
};