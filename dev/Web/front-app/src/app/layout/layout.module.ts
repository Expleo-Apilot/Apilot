import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WorkspaceMenuComponent } from '../features/workspace/workspace-menu/workspace-menu.component';
import { MainContentComponent } from './main-content/main-content.component';
import { TabsAreaComponent } from './tabs-area/tabs-area.component';
import { ResponseAreaComponent } from './response-area/response-area.component';
import { ToolsPanelComponent } from './tools-panel/tools-panel.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonToggleGroup, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatSidenavModule} from '@angular/material/sidenav';
import {RouterModule, RouterOutlet} from '@angular/router';
import {MatList, MatListItem, MatListModule} from '@angular/material/list';
import {MonacoEditorModule} from 'ngx-monaco-editor-v2';
import {MatTabsModule} from '@angular/material/tabs';
import {FormsModule} from '@angular/forms';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatMenuModule} from '@angular/material/menu';

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    MainContentComponent,
    TabsAreaComponent,
    ToolsPanelComponent,
    ResponseAreaComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonToggleGroup,
    MatSidenavModule,
    RouterOutlet,
    MatList,
    MatListItem,
    MatTabsModule,
    MatButtonToggleModule,
    MatListModule,
    DragDropModule,
    MonacoEditorModule,
    MatMenuModule,
    WorkspaceMenuComponent,
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
    ToolsPanelComponent,
    TabsAreaComponent,
    ResponseAreaComponent
  ]
})
export class LayoutModule { }
