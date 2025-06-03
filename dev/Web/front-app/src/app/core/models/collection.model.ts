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
  isShared?: boolean; // Flag to indicate if this collection is shared with the user
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
  success: boolean;
  isSuccess?: boolean; // For backward compatibility
  data: T;
  error?: any | null; // For backward compatibility
  message?: string; // Added to match backend response format
}
