import {Environment} from './environment.model';
import {Authentication, KeyValuePair, Request} from './request.model';
import {HttpMethod} from './http-method.enum';



export interface History {
  id: number;
  timeStamp: Date;
  workSpaceId : number;
  isDeleted : boolean;
  Requests : PerformRequestDto
}

export interface CreateHistoryDto{
  timeStamp: Date;
  workSpaceId : number;
  Requests : PerformRequestDto
}

export interface HistoryResponse {
  isSuccess: boolean;
  data: Environment;
  error: string | null;
}

export interface HistoriesResponse {
  isSuccess: boolean;
  data: Environment[];
  error: string | null;
}

export interface PerformRequestDto {
  method: HttpMethod;
  url: string;
  params:  { [key: string]: string };
  headers: { [key: string]: string };
  authentication?: Authentication;
  body?: any;
}
