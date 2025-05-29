import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RequestRoutingModule } from './request-routing.module';
import { RequestEditorComponent } from './request-editor/request-editor.component';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import {MatMenuModule} from '@angular/material/menu';

@NgModule({
  declarations: [
    RequestEditorComponent,
  ],
  imports: [
    CommonModule,
    RequestRoutingModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    MonacoEditorModule,
    MatMenuModule,
    TabBarComponent
  ],
  exports: [
    RequestEditorComponent,
  ]
})
export class RequestModule { }
