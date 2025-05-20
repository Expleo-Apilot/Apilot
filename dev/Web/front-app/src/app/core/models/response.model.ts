import {KeyValuePair} from './request.model';

export interface Response {
  statusCode: number;
  statusText: string;
  headers: KeyValuePair[];
  body: any;
  cookies: KeyValuePair[];
  responseTime: number;
  size: number;
  timestamp: Date;
}
