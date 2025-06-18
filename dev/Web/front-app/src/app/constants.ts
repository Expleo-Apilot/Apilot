/**
 * Application-wide constants
 */

// Base API URL for backend services
export const API_BASE_URL = 'http://localhost:5051';

// Default pagination values
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_INDEX = 0;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  WORKSPACE_ID: 'workspace_id',
  ACTIVE_ENVIRONMENT_ID: 'active_environment_id'
};
