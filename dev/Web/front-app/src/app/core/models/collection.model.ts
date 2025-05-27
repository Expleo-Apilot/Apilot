import { Folder } from './folder.model';
import { Request } from './request.model';

export interface Collection {
  id: number;
  name: string;
  description?: string;
  workSpaceId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  lastSyncDate: string | null;
  syncId: string;
  folders: Folder[];
  requests: Request[];
}


export interface CreateCollectionRequest {
  name: string;
  description?: string;
  workSpaceId: number;
}

export interface UpdateCollectionRequest {
  id: number;
  name: string;
  description?: string;
  workSpaceId: number;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any | null;
}
