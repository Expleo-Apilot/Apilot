import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResponseRoutingModule } from './response-routing.module';
import { ResponseComponent } from './response/response.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MonacoEditorModule} from 'ngx-monaco-editor-v2';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ResponseComponent
  ],
  imports: [
    CommonModule,
    ResponseRoutingModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MonacoEditorModule,
  ],
  exports: [
    ResponseComponent
  ]
})
export class ResponseModule { }
