import {KeyValuePair} from './request.model';

export interface Environment {
  id: string;
  name: string;
  variables: KeyValuePair[];
  isActive: boolean;
}
