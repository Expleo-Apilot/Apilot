import { HttpMethod } from './http-method.enum';
import { AuthType } from './auth-type.enum';

export interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

// Authentication model matching the backend AuthenticationDto
export interface Authentication {
  authType: AuthType;
  authData: { [key: string]: string };
}

// Base request interface matching the backend RequestDto
export interface Request {
  id?: number;
  name: string;
  url: string;
  httpMethod: HttpMethod;
  headers: { [key: string]: string };
  authentication?: Authentication;
  body?: any;
  parameters?: { [key: string]: string };
  folderId?: number | null;
  collectionId?: number | null;
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
  isShared?: boolean;
}

// Create request interface matching the backend CreateRequestDto
export interface CreateRequestDto {
  // Use PascalCase to match C# naming conventions
  Name: string;
  Url: string;
  HttpMethod: HttpMethod;
  Headers: { [key: string]: string };
  Authentication?: Authentication;
  Body?: any;
  Parameters?: { [key: string]: string };
  FolderId?: number | null;
  CollectionId?: number | null;
  IsShared?: boolean;
}

// Helper interfaces for frontend use
export interface RequestFormData {
  url: string;
  method: HttpMethod;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body?: string;
  authType: AuthType;
  authData?: { [key: string]: string };
}

// Converter functions to transform between frontend and backend models
export function convertFormDataToRequest(formData: RequestFormData, name: string, collectionId?: number, folderId?: number, isShared?: boolean): CreateRequestDto {
  // Convert KeyValuePair arrays to dictionaries
  const headers: { [key: string]: string } = {};
  formData.headers
    .filter(h => h.enabled && h.key.trim() !== '')
    .forEach(h => headers[h.key] = h.value);
  
  const parameters: { [key: string]: string } = {};
  formData.params
    .filter(p => p.enabled && p.key.trim() !== '')
    .forEach(p => parameters[p.key] = p.value);
  
  // Create authentication object if not NONE
  let authentication: Authentication | undefined;
  if (formData.authType !== AuthType.NONE) {
    authentication = {
      authType: formData.authType,
      authData: formData.authData || {}
    };
  }
  
  // Parse body if it's JSON, otherwise use as is
  let parsedBody = null;
  if (formData.body) {
    try {
      parsedBody = JSON.parse(formData.body);
    } catch (e) {
      // If parsing fails, use the raw string
      parsedBody = formData.body;
    }
  }

  // Create the request object with property names matching the backend's C# naming conventions (PascalCase)
  return {
    Name: name,
    Url: formData.url,
    HttpMethod: formData.method,
    Headers: headers,
    Parameters: parameters,
    Authentication: authentication,
    Body: parsedBody,
    CollectionId: collectionId || null,
    FolderId: folderId || null,
    IsShared: isShared || false
  };
}
