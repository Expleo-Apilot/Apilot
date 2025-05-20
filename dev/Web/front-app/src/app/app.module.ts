import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {LayoutModule} from './layout/layout.module';
import {AngularSplitModule, SplitAreaComponent, SplitComponent} from 'angular-split';
import {MonacoEditorModule} from 'ngx-monaco-editor-v2';
import { MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RequestModule } from './features/request/request.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LayoutModule,
    SplitAreaComponent,
    BrowserAnimationsModule,
    MatSidenavContainer,
    MatSidenavContent,
    AngularSplitModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MonacoEditorModule.forRoot(),
    SplitComponent,
    SplitAreaComponent,
    RequestModule

  ],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
