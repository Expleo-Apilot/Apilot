import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MainContentComponent } from './main-content/main-content.component';
import { TabsAreaComponent } from './tabs-area/tabs-area.component';
import { ResponseAreaComponent } from './response-area/response-area.component';
import { ToolsPanelComponent } from './tools-panel/tools-panel.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatSidenavModule} from '@angular/material/sidenav';
import {RouterOutlet} from '@angular/router';
import {MatList, MatListItem} from '@angular/material/list';



@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    MainContentComponent,
    TabsAreaComponent,
    ResponseAreaComponent,
    ToolsPanelComponent
  ],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonToggleGroup,
    MatSidenavModule,
    RouterOutlet,
    MatList,
    MatListItem
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
    ToolsPanelComponent,
    TabsAreaComponent,
    ResponseAreaComponent,
    MainContentComponent
  ]
})
export class LayoutModule { }
