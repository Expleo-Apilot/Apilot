import {KeyValuePair} from './request.model';

export interface Environment {
  id: number;
  name: string;
  workSpaceId: number;
  variables: { [key: string]: string };
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  lastSyncDate?: Date;
  syncId: string;
}

export interface CreateEnvironmentRequest {
  name: string;
  workSpaceId: number;
  variables?: { [key: string]: string };
}

export interface UpdateEnvironmentRequest {
  id: number;
  name: string;
}

export interface AddVariableToEnvironmentRequest {
  environmentId: number;
  key: string;
  value: string;
}

export interface UpdateVariableInEnvironmentRequest {
  environmentId: number;
  key: string;
  value: string;
}

export interface AddVariablesToEnvironmentRequest {
  environmentId: number;
  variables: { [key: string]: string };
}

export interface RemoveVariableFromEnvironmentRequest {
  environmentId: number;
  key: string;
}
