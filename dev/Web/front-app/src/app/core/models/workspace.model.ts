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

export interface Collection {
  id: number;
  name: string;
  description: string;
  workSpaceId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  lastSyncDate: string | null;
  syncId: string;
  folders: any[];
  requests: any[];
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
