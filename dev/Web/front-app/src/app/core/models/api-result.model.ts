/**
 * Generic API result model that wraps responses from the backend
 * @template T - The type of data contained in the result
 */
export interface ApiResult<T> {
  /**
   * Indicates whether the operation was successful
   */
  succeeded: boolean;
  
  /**
   * The data returned from the operation if successful
   */
  data?: T;
  
  /**
   * Error message if the operation failed
   */
  message?: string;
  
  /**
   * List of validation errors if applicable
   */
  errors?: string[];
}
