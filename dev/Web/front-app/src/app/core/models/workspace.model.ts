import {Collection} from './collection.model';
export interface Workspace {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  lastSyncDate: string | null;
  syncId: string;
  collections: Collection[];
  environments: Environment[];
  histories: any[];
}


export interface WorkspaceCreateRequest {
  name: string;
  description: string;
  userId : string;
}

export interface WorkspaceUpdateRequest {
  id: number;
  name?: string;
  description?: string;
  userId : string;
}

export interface WorkspaceResponse {
  isSuccess: boolean;
  data: Workspace;
  error: string | null;
}

export interface WorkspacesResponse {
  isSuccess: boolean;
  data: Workspace[];
  error: string | null;
}


export interface Environment {
  id: number;
  name: string;
  workSpaceId: number;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  lastSyncDate: string | null;
  syncId: string;
}
