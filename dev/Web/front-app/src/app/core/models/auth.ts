export enum AuthType {
  None = 'None',
  Basic = 'Basic',
  Bearer = 'Bearer',
  ApiKey = 'ApiKey',
  OAuth2 = 'OAuth2'
}

export interface AuthData {
  authType: AuthType;
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyLocation?: 'header' | 'query';
  apiKeyName?: string;
}

export interface BasicAuthData {
  username: string;
  password: string;
}

export interface BearerAuthData {
  token: string;
}

export interface ApiKeyAuthData {
  key: string;
  value: string;
  location: 'header' | 'query';
}
