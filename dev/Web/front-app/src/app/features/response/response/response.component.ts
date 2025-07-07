
import { Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { ResponseService } from '../../../core/services/response.service';
import { ClipboardService, ClipboardNotification } from '../../../core/services/clipboard.service';
import { Subscription } from 'rxjs';
import { RequestService } from '../../../core/services/request.service';
import { TabService } from '../../../core/services/tab.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateRequestDto, convertFormDataToRequest, RequestFormData, Authentication } from '../../../core/models/request.model';
import { HttpMethod } from '../../../core/models/http-method.enum';
import { AuthType } from '../../../core/models/auth-type.enum';

// More specific interface for cookie properties
interface ResponseCookieProperties {
  Path?: string;
  Expires?: string | Date;
  Domain?: string;
  Secure?: boolean;
  HttpOnly?: boolean;
  SameSite?: 'Strict' | 'Lax' | 'None';
  "Max-Age"?: number;
  [otherKey: string]: string | boolean | number | Date | undefined;
}

interface ResponseCookie {
  name: string;
  value: string;
  properties?: ResponseCookieProperties;
}

declare const monaco: any;

// Extend Window interface to include tabService
declare global {
  interface Window {
    tabService: any;
  }
}

@Component({
  selector: 'app-response',
  standalone: false,
  templateUrl: './response.component.html',
  styleUrl: './response.component.css'
})
export class ResponseComponent implements OnInit, OnChanges, OnDestroy {

  @Input() responseData: any; // Still keep the input for flexibility
  @Input() isLoading: boolean = false;
  @Input() tabId: string = '';
  @Input() requestUrl: string = '';
  @Input() requestMethod: string = '';
  @Input() requestHeaders: any[] = [];
  @Input() requestParams: any[] = [];
  @Input() requestBody: string = '';
  @Input() authData: any;
  @Input() workspaceId: string = '';
  isSaving: boolean = false;

  private subscription: Subscription = new Subscription();

  formattedBody: string = '';
  responseTime: number = 0;
  responseSize: number = 0;
  statusCode: number = 0;
  statusText: string = '';
  responseHeaders: { key: string, value: string }[] = [];
  cookies: ResponseCookie[] = [];
  notifications: ClipboardNotification[] = [];

  editorOptions = {
    theme: 'vs-light',
    language: 'plaintext',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on'
    
  };

  constructor(
    private responseService: ResponseService,
    private clipboardService: ClipboardService,
    private requestService: RequestService,
    private tabService: TabService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Subscribe to response data from the service
    this.subscription.add(
      this.responseService.responseData$.subscribe(data => {
        if (data) {
          this.processResponse(data);
        } else {
          this.resetView();
        }
      })
    );

    // Subscribe to clipboard notifications
    this.subscription.add(
      this.clipboardService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );

    window.addEventListener('themeChange', (event: any) => {
      this.setMonacoTheme(event.detail);

    });

  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Still handle input changes if provided
    if (changes['responseData']) {
      if (changes['responseData'].currentValue) {
        this.processResponse(changes['responseData'].currentValue);
      } else {
        this.resetView();
      }
    }
  }

  setMonacoTheme(theme: 'vs-light' | 'vs-dark') {
    monaco.editor.setTheme(theme);
    this.editorOptions = { ...this.editorOptions, theme };
  }

  /**
   * Copy the response body to clipboard
   */
  async copyResponseBody(): Promise<void> {
    if (!this.formattedBody && this.statusCode !== 204) {
      this.clipboardService.showNotification('No content to copy', 'error');
      return;
    }

    // For 204 responses, copy the message "204 No Content"
    const textToCopy = this.formattedBody || '204 No Content';
    await this.clipboardService.copyToClipboard(textToCopy);
  }

  /**
   * Remove a notification by ID
   */
  removeNotification(id: number): void {
    this.clipboardService.removeNotification(id);
  }

  copyToClipboard(content: string): void {
    this.clipboardService.copyToClipboard(content);
  }

  saveResponse(): void {
    if (!this.formattedBody && !this.statusCode) {
      return;
    }

    this.isSaving = true;
    
    // Get the current tab to find its parent ID (which is the request ID)
    this.responseService.currentTabId$.subscribe(currentTabId => {
      if (currentTabId) {
        // Use the injected tab service to access the tab data
        const tabs = this.tabService.tabs;
        const currentTab = tabs.find(tab => tab.id === currentTabId);
        if (currentTab && currentTab.parentId) {
          // Use the parent ID (request ID) directly
          const requestId = currentTab.parentId;
          
          // Create response data object
          const responseData = {
            statusCode: this.statusCode,
            statusText: this.statusText,
            headers: this.responseHeaders || [],
            cookies: this.cookies || [],
            body: this.formattedBody || '',
            responseTime: this.responseTime || 0,
            responseSize: this.responseSize || 0
          };
          
          // Convert the parentId to a number if it's not already
          const requestIdNumber = typeof requestId === 'string' ? parseInt(requestId, 10) : requestId;
          // Save the response using the dedicated endpoint with the existing request ID
          this.saveResponseData(responseData, requestIdNumber);
        } else {
          // No parent ID found, which means this is a new request that hasn't been saved yet
          this.saveResponseWithNewRequest();
        }
      } else {
        // No current tab ID, fall back to creating a new request
        this.saveResponseWithNewRequest();
      }
    }).unsubscribe(); // Unsubscribe immediately after use
  }

  private saveResponseData(responseData: any, requestId: number): void {
    this.responseService.saveResponse(responseData, requestId).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.isSuccess) {
          this.snackBar.open('Response saved successfully', 'Close', { duration: 3000 });
        } else {
          // Always show the same generic error message regardless of the specific error
          this.snackBar.open('Error save response', 'Dismiss', { duration: 7000, panelClass: ['error-snackbar'] });
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        // Always show the same generic error message regardless of the specific error
        this.snackBar.open('Error save response', 'Dismiss', { duration: 7000, panelClass: ['error-snackbar'] });
        // Log the actual error for debugging purposes
        console.error('Response save error:', error);
      }
    });
  }

  // Helper method to save response by first creating a new request
  private saveResponseWithNewRequest(): void {
    // First, save a minimal request to get a request ID
    const urlPath = this.requestUrl?.split('?')[0] || 'unknown';
    const requestName = `${this.requestMethod || 'GET'} ${urlPath}`;
    
    // Create a minimal request DTO
    const requestDto: CreateRequestDto = {
      Name: requestName,
      Url: this.requestUrl || '',
      HttpMethod: this.requestMethod as HttpMethod || HttpMethod.GET,
      Headers: {},
      Parameters: {},
      WorkspaceId: this.workspaceId
    };

    // First save the request to get an ID
    this.requestService.saveRequest(requestDto).subscribe({
      next: (requestResponse) => {
        if (requestResponse.isSuccess && requestResponse.data && requestResponse.data.id) {
          // Now save the response with the request ID
          const requestId = requestResponse.data.id;
          
          // Create response data object
          const responseData = {
            statusCode: this.statusCode,
            statusText: this.statusText,
            headers: this.responseHeaders || [],
            cookies: this.cookies || [],
            body: this.formattedBody || '',
            responseTime: this.responseTime || 0,
            responseSize: this.responseSize || 0
          };
          
          // Save the response using the dedicated endpoint
          this.responseService.saveResponse(responseData, requestId).subscribe({
            next: (response) => {
              this.isSaving = false;
              if (response.isSuccess) {
                this.snackBar.open('Response saved successfully', 'Close', { duration: 3000 });
              } else {
                const errorMessage = response.error || 'Failed to save response';
                this.snackBar.open(errorMessage, 'Dismiss', { duration: 7000, panelClass: ['error-snackbar'] });
              }
            },
            error: (error) => {
              this.isSaving = false;
              let errorMessage = 'An error occurred while saving the response';
              
              if (error.error && error.error.error) {
                errorMessage = error.error.error;
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              console.error('Error saving response:', error);
            }
          });
        } else {
          this.isSaving = false;
          this.snackBar.open('Error save response', 'Dismiss', { duration: 7000, panelClass: ['error-snackbar'] });
          console.error('Error creating request for response');
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        this.snackBar.open('Error save response', 'Dismiss', { duration: 7000, panelClass: ['error-snackbar'] });
        console.error('Error creating request for response:', error);
      }
    });
  }

  private resetView(): void {
    this.formattedBody = '';
    this.responseTime = 0;
    this.responseSize = 0;
    this.statusCode = 0;
    this.statusText = 'No Response';
    this.responseHeaders = [];
    this.cookies = [];
    this.updateEditorLanguage(undefined); // Reset to plaintext
  }

  private updateEditorLanguage(contentTypeHeader?: string): void {
    let lang = 'plaintext';
    if (contentTypeHeader) {
      const lowerContentType = contentTypeHeader.toLowerCase();
      if (lowerContentType.includes('application/json')) {
        lang = 'json';
      } else if (lowerContentType.includes('application/xml') || lowerContentType.includes('text/xml')) {
        lang = 'xml';
      } else if (lowerContentType.includes('text/html')) {
        lang = 'html';
      } else if (lowerContentType.includes('text/css')) {
        lang = 'css';
      } else if (lowerContentType.includes('application/javascript') || lowerContentType.includes('text/javascript')) {
        lang = 'javascript';
      } else if (lowerContentType.includes('text/plain')) {
        lang = 'plaintext';
      }
    }
    this.editorOptions = { ...this.editorOptions, language: lang };
  }

  processResponse(response: any): void {
    if (!response) {
      this.resetView();
      return;
    }

    if (response.error && response.message) { // Custom error structure
      this.statusCode = response.details?.status || 0;
      this.statusText = response.details?.statusText || response.message || 'Error';
      this.responseTime = response.responseTime || 0;
      this.responseHeaders = [];
      let errorBody = response.details || response;
      if (typeof errorBody === 'object') {
        this.formattedBody = JSON.stringify(errorBody, null, 2);
        this.updateEditorLanguage('application/json');
      } else {
        this.formattedBody = String(errorBody);
        this.updateEditorLanguage('text/plain');
      }
      this.responseSize = this.formattedBody ? new TextEncoder().encode(this.formattedBody).length : 0;
      this.cookies = [];
      return;
    }

    this.statusCode = response.status || response.statusCode || 0;
    this.statusText = response.statusText || (this.statusCode === 0 ? 'Request Failed' : 'Unknown Status');
    this.responseTime = response.responseTime || 0;

    this.responseHeaders = [];
    let contentTypeHeader: string | undefined;
    if (response.headers) {
      if (response.headers instanceof HttpHeaders) {
        response.headers.keys().forEach((key: string) => {
          const value = response.headers.getAll(key)?.join(', ');
          if (value !== null && value !== undefined) {
            this.responseHeaders.push({ key, value });
            if (key.toLowerCase() === 'content-type') {
              contentTypeHeader = value;
            }
          }
        });
      } else if (typeof response.headers.forEach === 'function') { // Standard Headers object
        (response.headers as Headers).forEach((value: string, key: string) => {
          this.responseHeaders.push({ key, value });
          if (key.toLowerCase() === 'content-type') {
            contentTypeHeader = value;
          }
        });
      } else if (typeof response.headers === 'object') { // Plain object
        for (const key in response.headers) {
          if (Object.prototype.hasOwnProperty.call(response.headers, key)) {
            const value = String(response.headers[key]);
            this.responseHeaders.push({ key, value });
            if (key.toLowerCase() === 'content-type') {
              contentTypeHeader = value;
            }
          }
        }
      }
    }
    this.updateEditorLanguage(contentTypeHeader);

    if (response.body !== undefined && response.body !== null) {
      if (contentTypeHeader?.includes('json') && typeof response.body === 'string') {
        // If Content-Type is JSON but body is a string, try to parse then re-stringify for formatting
        try {
          this.formattedBody = JSON.stringify(JSON.parse(response.body), null, 2);
        } catch (e) {
          this.formattedBody = response.body; // Fallback to string if not valid JSON
        }
      } else if (typeof response.body === 'object') {
        try {
          this.formattedBody = JSON.stringify(response.body, null, 2);
        } catch (e) {
          this.formattedBody = String(response.body); // Fallback for circular refs etc.
        }
      } else {
        this.formattedBody = String(response.body);
      }
    } else {
      this.formattedBody = (this.statusCode === 204) ? '204 No Content' : '';
    }

    this.responseSize = response.responseSize !== undefined ? response.responseSize : (this.formattedBody ? new TextEncoder().encode(this.formattedBody).length : 0);
    this.cookies = response.cookies?.cookies || []; // Handle either response.cookies or response.cookies.cookies
  }
}





