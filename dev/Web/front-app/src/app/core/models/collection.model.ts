import { Folder } from './folder.model';
import { Request } from './request.model';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  folders: Folder[];
  requests: Request[];
  createdAt: Date;
  updatedAt: Date;
}
