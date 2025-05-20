import { Request } from './request.model';

export interface Folder {
  id: string;
  name: string;
  requests: Request[];
  folders?: Folder[];
  parentId?: string; // ID of parent folder or collection
}
