import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {LayoutModule} from './layout/layout.module';
import {AngularSplitModule, SplitAreaComponent, SplitComponent} from 'angular-split';
import {MonacoEditorModule} from 'ngx-monaco-editor-v2';
import { MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RequestModule } from './features/request/request.module';
import { ResponseModule } from './features/response/response.module';
import { WorkspaceModule } from './features/workspace/workspace.module';
import { CollaborationModule } from './features/collaboration/collaboration.module';
import { CollaborationService } from './core/services/collaboration.service';
import { SignalRService } from './core/services/signalr.service';
import { AuthInterceptor } from './auth/auth.interceptor';
import { GeminiService } from './core/services/gemini.service';
import { OllamaService } from './core/services/ollama.service';
import { LlmFactoryService } from './core/services/llm-factory.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LayoutModule,
    AngularSplitModule,
    BrowserAnimationsModule,
    MatSidenavContainer,
    MatSidenavContent,
    HttpClientModule,
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MonacoEditorModule.forRoot(),
    SplitComponent,
    SplitAreaComponent,
    RequestModule,
    ResponseModule,
    WorkspaceModule,
    CollaborationModule
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    CollaborationService,
    SignalRService,
    GeminiService,
    OllamaService,
    LlmFactoryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
