import { HttpMethod } from '../http-method.enum';
import { PerformRequestDto } from '../history.model';

/**
 * DTO for creating a new history entry
 */
export interface CreateHistoryDto {
  timeStamp: Date;
  workSpaceId: number;
  Requests: PerformRequestDto;
}

/**
 * Response format for history operations
 */
export interface HistoryResponse {
  isSuccess: boolean;
  data?: any;
  message?: string;
  error?: string;
}
