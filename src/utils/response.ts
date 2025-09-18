import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '@/types';

export class ResponseUtils {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = StatusCodes.OK
  ): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      statusCode,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    error?: string
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      statusCode,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message: string = 'Data retrieved successfully',
    statusCode: number = StatusCodes.OK
  ): Response<PaginatedResponse<T[]>> {
    const response: PaginatedResponse<T[]> = {
      success: true,
      message,
      data,
      meta,
      statusCode,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully'
  ): Response<ApiResponse<T>> {
    return this.success(res, data, message, StatusCodes.CREATED);
  }

  /**
   * Send no content response
   */
  static noContent(res: Response): Response {
    return res.status(StatusCodes.NO_CONTENT).send();
  }

  /**
   * Send bad request response
   */
  static badRequest(
    res: Response,
    message: string = 'Bad Request',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.BAD_REQUEST, error);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.UNAUTHORIZED, error);
  }

  /**
   * Send forbidden response
   */
  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.FORBIDDEN, error);
  }

  /**
   * Send not found response
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.NOT_FOUND, error);
  }

  /**
   * Send conflict response
   */
  static conflict(
    res: Response,
    message: string = 'Conflict',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.CONFLICT, error);
  }

  /**
   * Send unprocessable entity response
   */
  static unprocessableEntity(
    res: Response,
    message: string = 'Unprocessable Entity',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.UNPROCESSABLE_ENTITY, error);
  }

  /**
   * Send too many requests response
   */
  static tooManyRequests(
    res: Response,
    message: string = 'Too Many Requests',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.TOO_MANY_REQUESTS, error);
  }

  /**
   * Send internal server error response
   */
  static internalServerError(
    res: Response,
    message: string = 'Internal Server Error',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }

  /**
   * Send service unavailable response
   */
  static serviceUnavailable(
    res: Response,
    message: string = 'Service Unavailable',
    error?: string
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.SERVICE_UNAVAILABLE, error);
  }

  /**
   * Create pagination metadata
   */
  static createPaginationMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    errors: any,
    message: string = 'Validation failed'
  ): Response<ApiResponse> {
    return this.error(res, message, StatusCodes.UNPROCESSABLE_ENTITY, errors);
  }

  /**
   * Send authentication error response
   */
  static authenticationError(
    res: Response,
    message: string = 'Authentication failed'
  ): Response<ApiResponse> {
    return this.unauthorized(res, message);
  }

  /**
   * Send authorization error response
   */
  static authorizationError(
    res: Response,
    message: string = 'Access denied'
  ): Response<ApiResponse> {
    return this.forbidden(res, message);
  }

  /**
   * Send rate limit error response
   */
  static rateLimitError(
    res: Response,
    message: string = 'Rate limit exceeded'
  ): Response<ApiResponse> {
    return this.tooManyRequests(res, message);
  }
}

export default ResponseUtils;