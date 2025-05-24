import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkspaceRoutingModule } from './workspace-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import { WorkspaceComponent } from './workspace.component';
import { AngularSplitModule } from 'angular-split';
import { RequestModule } from '../request/request.module';
import { ResponseModule } from '../response/response.module';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { LayoutModule } from '../../layout/layout.module';


@NgModule({
  imports: [
    CommonModule,
    WorkspaceRoutingModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatIconModule,
    AngularSplitModule,
    RequestModule,
    ResponseModule,
    LayoutModule
  ],
  declarations: [
    WorkspaceComponent
  ],
  exports: [
    WorkspaceComponent
  ]
})
export class WorkspaceModule { }
