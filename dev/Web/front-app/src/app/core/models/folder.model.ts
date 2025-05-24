import { Request } from './request.model';

export interface Folder {
  id: number;
  name: string;
  collectionId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  lastSyncDate: string | null;
  syncId: string;
  requests: Request[];
}

export interface CreateFolderRequest {
  name: string;
  collectionId: number;
}

export interface UpdateFolderRequest {
  id: number;
  name: string;
  collectionId: number;
}
