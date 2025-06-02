export enum CollaborationPermission {
  View = 0,
  Edit = 1
}

export enum CollaborationStatus {
  Pending = 0,
  Accepted = 1,
  Declined = 2
}

export interface Collaboration {
  id: number;
  collectionId: number;
  collectionName: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  invitedByUserId: string;
  invitedByUserName: string;
  permission: CollaborationPermission;
  status: CollaborationStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCollaborationRequest {
  collectionId: number;
  email: string;
  permission: CollaborationPermission;
}

export interface UpdateCollaborationStatusRequest {
  collaborationId: number;
  status: CollaborationStatus;
}

export interface ApiResponse<T> {
  success: boolean;
  isSuccess?: boolean; // For backward compatibility
  data?: T;
  message: string;
}
