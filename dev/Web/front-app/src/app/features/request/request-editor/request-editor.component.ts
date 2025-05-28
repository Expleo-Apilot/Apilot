// request-editor.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpMethod } from '../../../core/models/http-method.enum';
import { AuthType } from '../../../core/models/auth-type.enum';
import { HttpClientService } from '../../../core/services/http-client.service';
import { KeyValuePair } from '../../../core/models/request.model';
import { ResponseService } from '../../../core/services/response.service';

@Component({
  selector: 'app-request-editor',
  templateUrl: './request-editor.component.html',
  styleUrls: ['./request-editor.component.css'],
  standalone: false,
})
export class RequestEditorComponent implements OnInit {
  requestForm!: FormGroup;
  httpMethods = Object.values(HttpMethod);
  authTypes = Object.values(AuthType);

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

  constructor(
    private fb: FormBuilder,
    private httpClientService: HttpClientService,
    private responseService: ResponseService, // Inject the new ResponseService
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

    // Subscribe to URL changes to parse parameters
    this.requestForm.get('url')?.valueChanges.subscribe((url) => {
      if (url) {
        this.parseUrlParameters(url);
      }
      this.cdr.detectChanges();
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
  }

  /**
   * Removes a header at the specified index
   */
  removeHeader(index: number): void {
    if (index >= 0 && index < this.headers.length) {
      this.headers.splice(index, 1);
      // If all headers are removed, add an empty one
      if (this.headers.length === 0) {
        this.addHeader();
      }
    }
  }

  /**
   * Handles changes to header key/value pairs
   * Ensures proper formatting of Authorization headers
   */
  onHeaderChange(header: KeyValuePair): void {
    // If this is an Authorization header, ensure proper formatting
    if (header.key.toLowerCase() === 'authorization') {
      // If we're not using auth type and the header doesn't start with Bearer/Basic
      if (this.selectedAuthType === AuthType.NONE) {
        // Check if it's a token without the Bearer prefix
        if (header.value && !header.value.startsWith('Bearer ') && !header.value.startsWith('Basic ')) {
          // Auto-format as Bearer token
          header.value = `Bearer ${header.value}`;
        }
      }
    }
  }

  addParam(): void {
    this.params.push({ key: '', value: '', enabled: true });
    this.cdr.detectChanges();
  }

  removeParam(index: number): void {
    this.params.splice(index, 1);
    if (this.params.length === 0) {
      this.addParam();
    }
    this.cdr.detectChanges();
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

  sendRequest(): void {
    if (this.requestForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.responseData = null;

    // Clear any previous response data
    this.responseService.clearResponseData();
    
    // Update auth credentials and headers before sending
    this.updateAuthCredentials();

    const formValue = this.requestForm.value;
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
      authData // Include authentication data in the request
    ).subscribe({
      next: (response) => {
        this.responseData = response;
        this.isLoading = false;
        console.log('Response received:', this.responseData);

        // Update the response data in the service
        this.responseService.updateResponseData(response);
      },
      error: (error) => {
        console.error('Request error', error);
        this.responseData = {
          error: true,
          message: error.message || 'An error occurred during the request',
          details: error
        };
        this.isLoading = false;

        // Also update the response service with error data
        this.responseService.updateResponseData(this.responseData);
      }
    });
  }
}
