export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T | null;
  error: string | null;
} 