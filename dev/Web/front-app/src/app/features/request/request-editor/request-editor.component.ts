// request-editor.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpMethod } from '../../../core/models/http-method.enum';
import { AuthType } from '../../../core/models/auth-type.enum';
import { HttpClientService } from '../../../core/services/http-client.service';
import { KeyValuePair, Request, RequestFormData, convertFormDataToRequest } from '../../../core/models/request.model';
import { ResponseService } from '../../../core/services/response.service';
import { TabService } from '../../../core/services/tab.service';
import { RequestService } from '../../../core/services/request.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SaveRequestModalComponent, SaveLocation } from '../save-request-modal/save-request-modal.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-request-editor',
  templateUrl: './request-editor.component.html',
  styleUrls: ['./request-editor.component.css'],
  standalone: false,
})
export class RequestEditorComponent implements OnInit, OnDestroy {
  requestForm!: FormGroup;
  httpMethods = Object.values(HttpMethod);
  authTypes = Object.values(AuthType);
  workspaceIdRoute! : number;

  headers: KeyValuePair[] = [{ key: '', value: '', enabled: true }];
  params: KeyValuePair[] = [{ key: '', value: '', enabled: true }];

  responseData: any = null;
  isLoading = false;

  // Declare bodyType property
  bodyType: 'none' | 'json' | 'text' | 'form' = 'json'; // Default to JSON

  // Authentication properties
  selectedAuthType: AuthType = AuthType.NONE;
  basicAuthUsername: string = '';
  basicAuthPassword: string = '';
  bearerToken: string = '';

  // Tab management
  currentTabId: string | null = null;
  private subscriptions: Subscription[] = [];

  // Monaco editor options with improved configuration
  bodyEditorOptions = {
    theme: 'vs-dark',
    language: 'json', // Initial language
    automaticLayout: true, // Important for resizing
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    folding: true,
    lineNumbers: 'on',
    roundedSelection: true,
    contextmenu: true,
    wordWrap: 'on'
  };

  // Current workspace ID
  workspaceId: number = 0;

  constructor(
    private fb: FormBuilder,
    private httpClientService: HttpClientService,
    private responseService: ResponseService,
    private tabService: TabService,
    private requestService: RequestService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    public cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.setupDefaultHeaders();
    this.setupDefaultParams();

    // Initial language setting based on default bodyType
    this.updateBodyEditorLanguage(this.bodyType);

    // Listen to global theme changes
    window.addEventListener('themeChange', (event: any) => {
      this.setMonacoTheme(event.detail);
    });

    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme === 'dark' ? 'vs-dark' : 'vs-light';
    this.setMonacoTheme(theme);

    // Get workspace ID from route
    this.route.parent?.parent?.params.subscribe(params => {
      if (params['id']) {
        this.workspaceId = +params['id'];
      }
    });

    // Subscribe to URL changes to parse parameters
    const urlSubscription = this.requestForm.get('url')?.valueChanges.subscribe((url) => {
      if (url) {
        this.parseUrlParameters(url);
        // Save the current tab data when URL changes
        this.saveCurrentTabData();
      }
      this.cdr.detectChanges();
    });

    if (urlSubscription) {
      this.subscriptions.push(urlSubscription);
    }

    // Subscribe to method changes
    const methodSubscription = this.requestForm.get('method')?.valueChanges.subscribe(() => {
      // Save the current tab data when method changes
      this.saveCurrentTabData();
    });

    if (methodSubscription) {
      this.subscriptions.push(methodSubscription);
    }

    // Subscribe to body changes
    const bodySubscription = this.requestForm.get('body')?.valueChanges.subscribe(() => {
      // Save the current tab data when body changes
      this.saveCurrentTabData();
    });

    if (bodySubscription) {
      this.subscriptions.push(bodySubscription);
    }

    // Subscribe to auth type changes
    const authTypeSubscription = this.requestForm.get('authType')?.valueChanges.subscribe(authType => {
      this.selectedAuthType = authType;
      this.updateAuthHeaders();
      // Save the current tab data when auth type changes
      this.saveCurrentTabData();
    });

    if (authTypeSubscription) {
      this.subscriptions.push(authTypeSubscription);
    }

    // Subscribe to active tab changes
    this.subscriptions.push(
      this.tabService.activeTabId$.subscribe(tabId => {
        if (tabId && tabId !== this.currentTabId) {
          // Save current tab data before switching
          if (this.currentTabId) {
            this.saveCurrentTabData();
          }

          // Update current tab ID
          this.currentTabId = tabId;

          // Tell the response service about the tab change
          this.responseService.setCurrentTabId(tabId);

          // Load the new tab data
          this.loadTabData(tabId);
        } else if (!tabId && this.tabService.tabs.length === 0) {
          // If there are no tabs, create a new one
          this.currentTabId = this.tabService.createNewTab().id;
          this.responseService.setCurrentTabId(this.currentTabId);
        }
      })
    );

    // Initialize with the active tab or create one if none exists
    if (this.tabService.activeTab) {
      this.currentTabId = this.tabService.activeTab.id;
      this.responseService.setCurrentTabId(this.currentTabId);
      this.loadTabData(this.currentTabId);
    } else if (this.tabService.tabs.length > 0) {
      this.currentTabId = this.tabService.tabs[0].id;
      this.responseService.setCurrentTabId(this.currentTabId);
      this.tabService.activateTab(this.currentTabId);
    } else {
      this.currentTabId = this.tabService.createNewTab().id;
      this.responseService.setCurrentTabId(this.currentTabId);
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Remove event listener
    window.removeEventListener('themeChange', (event: any) => {
      this.setMonacoTheme(event.detail);
    });
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      url: ['https://simple-books-api.glitch.me', [Validators.required]],
      method: [HttpMethod.GET, [Validators.required]],
      body: ['{\n  "key": "value"\n}'],
      authType: [AuthType.NONE],
      basicAuthUsername: [''],
      basicAuthPassword: [''],
      bearerToken: ['']
    });

    // React to method changes to update body validation
    this.requestForm.get('method')?.valueChanges.subscribe(method => {
      if (method === HttpMethod.GET) {
        this.requestForm.get('body')?.disable();
      } else {
        this.requestForm.get('body')?.enable();
      }
    });

    // React to auth type changes
    this.requestForm.get('authType')?.valueChanges.subscribe(authType => {
      this.selectedAuthType = authType;
      this.updateAuthHeaders();
    });
  }

  // Method to update editor language dynamically
  updateBodyEditorLanguage(type: 'none' | 'json' | 'text' | 'form'): void {
    // Save the current body type to the tab
    if (this.currentTabId) {
      this.saveCurrentTabData();
    }
    let language: string;
    switch (type) {
      case 'json':
        language = 'json';
        break;
      case 'text':
        language = 'plaintext';
        break;
      case 'form':
        language = 'plaintext'; // Or 'xml', 'html' if you expect certain form data formats
        break;
      case 'none':
      default:
        language = 'plaintext';
        break;
    }
    // Create a new options object to trigger change detection in ngx-monaco-editor
    this.bodyEditorOptions = { ...this.bodyEditorOptions, language: language };
  }

  setMonacoTheme(theme: 'vs-light' | 'vs-dark') {
    this.bodyEditorOptions = {
      ...this.bodyEditorOptions,
      theme
    };
  }

  /**
   * Updates authentication headers based on selected auth type and credentials
   * Preserves manually added headers while ensuring proper formatting
   */
  updateAuthHeaders(): void {
    // Find any manually added Authorization header
    const manualAuthHeader = this.headers.find(h =>
      h.key.toLowerCase() === 'authorization' &&
      this.selectedAuthType === AuthType.NONE
    );

    // Remove existing auth headers only if we're using auth types
    if (this.selectedAuthType !== AuthType.NONE) {
      this.headers = this.headers.filter(h =>
        h.key.toLowerCase() !== 'authorization' &&
        h.key.toLowerCase() !== 'x-api-key'
      );
    }

    // Add appropriate auth header based on selected type
    switch (this.selectedAuthType) {
      case AuthType.BASIC:
        if (this.basicAuthUsername) {
          const credentials = btoa(`${this.basicAuthUsername}:${this.basicAuthPassword}`);
          this.headers.unshift({
            key: 'Authorization',
            value: `Basic ${credentials}`,
            enabled: true
          });
        }
        break;

      case AuthType.BEARER:
        if (this.bearerToken) {
          // Ensure the token doesn't already have the Bearer prefix
          const tokenValue = this.bearerToken.startsWith('Bearer ') ?
            this.bearerToken :
            `Bearer ${this.bearerToken}`;

          this.headers.unshift({
            key: 'Authorization',
            value: tokenValue,
            enabled: true
          });
        }
        break;

      case AuthType.API_KEY:
        // Implement API key auth if needed
        break;

      case AuthType.OAUTH2:
        // Implement OAuth2 if needed
        break;

      case AuthType.NONE:
      default:
        // Restore manually added Authorization header if it exists
        if (manualAuthHeader) {
          // Ensure we don't have duplicate Authorization headers
          this.headers = this.headers.filter(h => h.key.toLowerCase() !== 'authorization');
          this.headers.unshift(manualAuthHeader);
        }
        break;
    }
  }

  /**
   * Update auth credentials and refresh headers
   */
  updateAuthCredentials(): void {
    this.basicAuthUsername = this.requestForm.get('basicAuthUsername')?.value || '';
    this.basicAuthPassword = this.requestForm.get('basicAuthPassword')?.value || '';
    this.bearerToken = this.requestForm.get('bearerToken')?.value || '';
    this.updateAuthHeaders();
  }

  setupDefaultHeaders(): void {
    this.headers = [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Accept', value: 'application/json', enabled: true },

      { key: '', value: '', enabled: true }
    ];
  }

  setupDefaultParams(): void {
    this.params = [
      { key: '', value: '', enabled: true }
    ];
  }

  /**
   * Adds a new header to the headers list
   */
  addHeader(): void {
    this.headers.push({ key: '', value: '', enabled: true });
    this.saveCurrentTabData();
  }

  /**
   * Removes a header at the specified index
   */
  removeHeader(index: number): void {
    // Check if it's the last header
    if (this.headers.length === 1) {
      // If it's the last one, just reset it instead of removing
      this.headers[0] = { key: '', value: '', enabled: true };
    } else {
      // Otherwise remove the header
      this.headers.splice(index, 1);
    }

    // Update auth headers to ensure consistency
    this.updateAuthHeaders();

    // Save changes to the current tab
    this.saveCurrentTabData();
  }

  /**
   * Handles changes to header key/value pairs
   * Ensures proper formatting of Authorization headers
   */
  onHeaderChange(header: KeyValuePair): void {
    // Check if this is an Authorization header
    if (header.key.toLowerCase() === 'authorization') {
      // If it's manually edited, we need to update the auth type and credentials
      const value = header.value.trim();

      if (value.startsWith('Basic ')) {
        // Handle Basic auth
        this.requestForm.get('authType')?.setValue(AuthType.BASIC);
        // We could potentially decode and set username/password here
      } else if (value.startsWith('Bearer ')) {
        // Handle Bearer token
        this.requestForm.get('authType')?.setValue(AuthType.BEARER);
        this.requestForm.get('bearerToken')?.setValue(value.substring(7));
      }
    }

    // Save changes to the current tab
    this.saveCurrentTabData();

    this.cdr.detectChanges();
  }

  addParam(): void {
    this.params.push({ key: '', value: '', enabled: true });
    this.cdr.detectChanges();
  }

  removeParam(index: number): void {
    // Check if it's the last param
    if (this.params.length === 1) {
      // If it's the last one, just reset it
      this.params[0] = { key: '', value: '', enabled: true };
    } else {
      this.params.splice(index, 1);
    }

    // Save changes to the current tab
    this.saveCurrentTabData();
  }

  // Handle URL input event
  onUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const url = input.value;

    try {
      // Try to parse the URL
      const urlObj = new URL(url);
      const baseUrl = urlObj.origin + urlObj.pathname;

      // Update the form with the base URL
      this.requestForm.patchValue({ url: baseUrl }, { emitEvent: false });

      // Parse and update parameters
      this.parseUrlParameters(url);
    } catch (e) {
      // If URL is invalid, just update the form value
      this.requestForm.patchValue({ url: url }, { emitEvent: false });
    }

    this.cdr.detectChanges();
  }

  // Handle URL blur event
  onUrlBlur(): void {
    const url = this.requestForm.get('url')?.value;
    if (url) {
      try {
        // Try to parse the URL
        const urlObj = new URL(url);
        const baseUrl = urlObj.origin + urlObj.pathname;

        // Update the form with the base URL
        this.requestForm.patchValue({ url: baseUrl }, { emitEvent: false });

        // Parse and update parameters
        this.parseUrlParameters(url);
      } catch (e) {
        // If URL is invalid, do nothing
        console.log('Invalid URL format');
      }
    }
  }

  // Update the parseUrlParameters method
  private parseUrlParameters(url: string): void {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);

      // Clear existing params
      this.params = [];

      // Add each parameter from the URL
      searchParams.forEach((value, key) => {
        this.params.push({
          key: key,
          value: value,
          enabled: true
        });
      });

      // Add an empty row if no parameters
      if (this.params.length === 0) {
        this.params.push({ key: '', value: '', enabled: true });
      }

      this.cdr.detectChanges();
    } catch (e) {
      // If URL is invalid, do nothing
      console.log('Invalid URL format');
    }
  }

  // Update the buildQueryString method
  buildQueryString(): string {
    const validParams = this.params.filter(p => p.enabled && p.key.trim() !== '');

    if (validParams.length === 0) {
      return '';
    }

    const queryParams = new URLSearchParams();
    validParams.forEach(param => {
      if (param.key.trim()) {
        queryParams.append(param.key.trim(), param.value || '');
      }
    });

    return queryParams.toString();
  }

  // Update the processUrl method
  processUrl(baseUrl: string): string {
    const queryString = this.buildQueryString();

    if (!queryString) {
      return baseUrl;
    }

    try {
      const url = new URL(baseUrl);
      const hasQueryParams = url.search.length > 0;
      return hasQueryParams
        ? `${baseUrl}&${queryString}`
        : `${baseUrl}?${queryString}`;
    } catch (e) {
      // If URL is invalid, just append the query string
      const hasQueryParams = baseUrl.includes('?');
      return hasQueryParams
        ? `${baseUrl}&${queryString}`
        : `${baseUrl}?${queryString}`;
    }
  }

  // Update the getDisplayUrl method
  getDisplayUrl(): string {
    const baseUrl = this.requestForm.get('url')?.value;
    if (!baseUrl) return '';
    return this.processUrl(baseUrl);
  }

  // Load data from a tab
  private loadTabData(tabId: string): void {
    const tab = this.tabService.tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Update form values
    this.requestForm.patchValue({
      url: tab.url,
      method: tab.method,
      body: tab.body,
      authType: tab.authType,
      basicAuthUsername: tab.basicAuthUsername,
      basicAuthPassword: tab.basicAuthPassword,
      bearerToken: tab.bearerToken
    }, { emitEvent: false });

    // Update other component properties
    this.headers = [...tab.headers];
    this.params = [...tab.params];
    this.bodyType = tab.bodyType;
    this.selectedAuthType = tab.authType;
    this.basicAuthUsername = tab.basicAuthUsername;
    this.basicAuthPassword = tab.basicAuthPassword;
    this.bearerToken = tab.bearerToken;

    // Update UI state
    this.updateBodyEditorLanguage(this.bodyType);

    // If it's a GET request, disable the body
    if (tab.method === HttpMethod.GET) {
      this.requestForm.get('body')?.disable({ emitEvent: false });
    } else {
      this.requestForm.get('body')?.enable({ emitEvent: false });
    }

    // Load any existing response data for this tab
    this.responseData = this.responseService.getResponseForTab(tabId);

    this.cdr.detectChanges();
  }

  // Save current tab data
  private saveCurrentTabData(): void {
    if (!this.currentTabId) return;

    const formValue = this.requestForm.getRawValue(); // getRawValue includes disabled controls

    // Get the current tab to preserve parent information
    const currentTab = this.tabService.tabs.find(t => t.id === this.currentTabId);

    this.tabService.updateTabData(this.currentTabId, {
      url: formValue.url,
      method: formValue.method,
      body: formValue.body,
      params: [...this.params],
      headers: [...this.headers],
      bodyType: this.bodyType,
      authType: formValue.authType,
      basicAuthUsername: formValue.basicAuthUsername,
      basicAuthPassword: formValue.basicAuthPassword,
      bearerToken: formValue.bearerToken,
      // Preserve parent information (collection or folder ID and type)
      parentId: currentTab?.parentId,
      parentType: currentTab?.parentType
    });
  }

  /**
   * Save the current request to the database
   */
  saveRequest(): void {
    if (this.requestForm.invalid) {
      return;
    }

    const formValue = this.requestForm.getRawValue();
    const currentTab = this.tabService.tabs.find(t => t.id === this.currentTabId);

    if (!currentTab) {
      this.snackBar.open('Unable to save request: No active tab', 'Close', { duration: 3000 });
      return;
    }

    // Open the save request modal dialog
    const dialogRef = this.dialog.open(SaveRequestModalComponent, {
      width: '500px',
      data: {
        workspaceId: this.workspaceId,
        requestName: currentTab.name || this.getRequestNameFromUrl(formValue.url)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return; // User canceled
      }

      // Get the request name from the result or generate one from the URL
      const requestName = result.name || currentTab.name || this.getRequestNameFromUrl(formValue.url);

      // Create a RequestFormData object from the current form values
      const requestFormData: RequestFormData = {
        url: formValue.url,
        method: formValue.method,
        params: this.params.filter(p => p.key.trim() !== ''),
        headers: this.headers.filter(h => h.key.trim() !== ''),
        body: formValue.body,
        authType: formValue.authType,
        authData: {}
      };

      // Add authentication data based on the auth type
      if (formValue.authType === AuthType.BASIC) {
        requestFormData.authData = {
          'username': this.basicAuthUsername,
          'password': this.basicAuthPassword
        };
      } else if (formValue.authType === AuthType.BEARER) {
        requestFormData.authData = {
          'token': this.bearerToken
        };
      }

      // Set collection or folder ID based on the selected location
      let collectionId: number | undefined;
      let folderId: number | undefined;

      if (result.location) {
        const location: SaveLocation = result.location;
        if (location.type === 'collection') {
          collectionId = location.id;
          // Update the tab's parent information
          this.tabService.updateTabData(this.currentTabId!, {
            parentType: 'collection',
            parentId: location.id,
            name: requestName
          });
        } else if (location.type === 'folder') {
          folderId = location.id;
          // Update the tab's parent information
          this.tabService.updateTabData(this.currentTabId!, {
            parentType: 'folder',
            parentId: location.id,
            name: requestName
          });
        }
      }

      // Convert the form data to a request object compatible with the backend
      const requestToSave = convertFormDataToRequest(requestFormData, requestName, collectionId, folderId);

      // Call the API to save the request
      this.requestService.saveRequest(requestToSave).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.snackBar.open('Request saved successfully', 'Close', { duration: 3000 });
            console.log('Request saved:', response.data);
          } else {
            this.snackBar.open(`Failed to save request: ${response.error}`, 'Close', { duration: 5000 });
            console.error('Failed to save request:', response.error);
          }
        },
        error: (error) => {
          this.snackBar.open('Error saving request', 'Close', { duration: 5000 });
          console.error('Error saving request:', error);
        }
      });
    });
  }

  /**
   * Generate a request name from the URL
   * This extracts the last part of the URL path to use as a name
   */
  private getRequestNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];

      if (lastPart && lastPart.length > 0) {
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
      } else if (pathParts.length > 1 && pathParts[pathParts.length - 2]) {
        return pathParts[pathParts.length - 2].charAt(0).toUpperCase() + pathParts[pathParts.length - 2].slice(1);
      }

      // If no meaningful path parts, use the hostname
      return urlObj.hostname.split('.')[0].charAt(0).toUpperCase() + urlObj.hostname.split('.')[0].slice(1);
    } catch (e) {
      // If URL parsing fails, return a generic name
      return 'New Request';
    }
  }

  sendRequest(): void {
    if (this.requestForm.invalid) {
      return;
    }
    this.route.paramMap.subscribe(params => {
      const workspaceId = params.get('id');
      this.workspaceIdRoute = Number(workspaceId);
    });

    this.isLoading = true;
    this.responseData = null;

    // Clear any previous response data for this tab
    if (this.currentTabId) {
      this.responseService.clearResponseData(this.currentTabId);
    } else {
      this.responseService.clearResponseData();
    }

    // Update auth credentials and headers before sending
    this.updateAuthCredentials();

    const formValue = this.requestForm.getRawValue(); // Use getRawValue to get values from disabled controls too
    let body = null;

    // Prepare authentication data for the request
    let authData = null;
    if (this.selectedAuthType !== AuthType.NONE) {
      authData = {
        authType: this.selectedAuthType,
        authData: {}
      };

      switch (this.selectedAuthType) {
        case AuthType.BASIC:
          authData.authData = {
            username: this.basicAuthUsername,
            password: this.basicAuthPassword
          };
          break;

        case AuthType.BEARER:
          authData.authData = {
            token: this.bearerToken
          };
          break;

        case AuthType.API_KEY:
          // Will be implemented in the future
          break;

        case AuthType.OAUTH2:
          // Will be implemented in the future
          break;
      }
    }

    // Process the URL with query parameters
    const processedUrl = this.processUrl(formValue.url);

    // Try to parse the JSON body if it's not empty and not a GET request and bodyType is JSON
    if (formValue.method !== HttpMethod.GET && this.bodyType === 'json' && formValue.body && formValue.body.trim()) {
      try {
        body = JSON.parse(formValue.body);
      } catch (e) {
        console.error('Invalid JSON body', e);
        alert('The request body is not valid JSON');
        this.isLoading = false;
        return;
      }
    } else if (formValue.method !== HttpMethod.GET && (this.bodyType === 'text' || this.bodyType === 'form')) {
      body = formValue.body; // Send as plain text for 'text' or 'form' types
    }

    // Only include headers that have a key (and are enabled)
    const validHeaders = this.headers.filter(h => h.key.trim() !== '' && h.enabled);

    this.httpClientService.sendRequest(
      processedUrl,
      formValue.method,
      validHeaders,
      this.params.filter(p => p.key.trim() !== '' && p.enabled),
      body,
      authData ,
      this.workspaceIdRoute// Include authentication data in the request
    ).subscribe({
      next: (response) => {
        this.responseData = response;
        this.isLoading = false;
        console.log('Response received:', this.responseData);

        // Update the response data in the service for this specific tab
        if (this.currentTabId) {
          this.responseService.updateResponseData(response, this.currentTabId);
        } else {
          this.responseService.updateResponseData(response);
        }
      },
      error: (error) => {
        console.error('Request error', error);
        this.responseData = {
          error: true,
          message: error.message || 'An error occurred during the request',
          details: error
        };
        this.isLoading = false;

        // Also update the response service with error data for this specific tab
        if (this.currentTabId) {
          this.responseService.updateResponseData(this.responseData, this.currentTabId);
        } else {
          this.responseService.updateResponseData(this.responseData);
        }
      }
    });
  }
}
