import { HttpMethod } from './http-method.enum';

export interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface RequestBody {
  contentType: string;
  content: string; // JSON or other content types
}

export interface Request {
  id: number;
  name: string;
  url: string;
  method: HttpMethod;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body?: RequestBody;
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'apikey';
    credentials?: any; // Depends on auth type
  };
  tests?: string; // Test scripts
  parentId?: string; // ID of parent folder or collection
}
