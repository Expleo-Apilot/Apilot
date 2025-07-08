import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InviteModalComponent } from './invite-modal/invite-modal.component';
import { InvitationNotificationsComponent } from './invitation-notifications/invitation-notifications.component';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';

@NgModule({
  declarations: [
    InviteModalComponent,
    InvitationNotificationsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatButtonToggleGroup,
    MatButtonToggle
  ],
  exports: [
    InviteModalComponent,
    InvitationNotificationsComponent
  ]
})
export class CollaborationModule { }
