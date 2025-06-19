// request-editor.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { take, finalize } from 'rxjs/operators';
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
import { ActivatedRoute, ParamMap } from '@angular/router';
import { VariableReplacementService } from '../../../core/services/variable-replacement.service';
import { EnvironmentService } from '../../../core/services/environment.service';
import { Environment } from '../../../core/models/environment.model';

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
  workspaceIdRoute!: number;

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

  // Environment variable support
  environmentVariables: { [key: string]: string } = {};
  activeEnvironmentId: number | null = null;
  urlPreview: string = ''; // Holds the URL with variables replaced for preview
  
  // Environment selection
  environments: Environment[] = [];
  noEnvironmentOption = { id: 0, name: 'No Environment', description: '', variables: {}, workspaceId: 0, isGlobal: false };

  constructor(
    private fb: FormBuilder,
    private httpClientService: HttpClientService,
    private responseService: ResponseService,
    private tabService: TabService,
    private requestService: RequestService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    public cdr: ChangeDetectorRef,
    private variableReplacementService: VariableReplacementService,
    private environmentService: EnvironmentService
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

    // Subscribe to environment variables and update URL preview when variables change
    const envVarsSubscription = this.variableReplacementService.getCurrentEnvironmentVariables()
      .subscribe(variables => {
        this.environmentVariables = variables;
        this.updateUrlPreview();
      });
    this.subscriptions.push(envVarsSubscription);

    // Subscribe to active environment changes
    const activeEnvSubscription = this.variableReplacementService.getActiveEnvironmentId()
      .subscribe(id => {
        this.activeEnvironmentId = id;
      });
    this.subscriptions.push(activeEnvSubscription);
    
    // Load environments for the current workspace and activate the first one by default
    this.route.paramMap.pipe(
      take(1) // Take only the first emission and complete
    ).subscribe((params: ParamMap) => {
      const workspaceId = params.get('id');
      if (workspaceId) {
        this.loadEnvironmentsForWorkspace(Number(workspaceId), true);
        
        // Subscribe to environment changes to reload the dropdown when environments are created or updated
        const envChangesSubscription = this.environmentService.environmentsChanged$
          .subscribe(changedWorkspaceId => {
            // Only reload if the changes affect our current workspace
            if (changedWorkspaceId === Number(workspaceId)) {
              // Reload environments but preserve the current active environment
              this.loadEnvironmentsForWorkspace(Number(workspaceId), false);
            }
          });
        this.subscriptions.push(envChangesSubscription);
      }
    });

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
        // Update URL preview with variables replaced
        this.updateUrlPreview();
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

    // Subscribe to active tab changes and load tab data when tab changes
    this.subscriptions.push(
      this.tabService.activeTabId$.subscribe(tabId => {
        if (tabId && tabId !== this.currentTabId) {
          // Save current tab data before switching
          if (this.currentTabId) {
            this.saveCurrentTabData();
          }
          // Update current tab ID and load new tab data
          this.currentTabId = tabId;
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
      url: ['', [Validators.required]],
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

      // Update URL preview with replaced variables
      this.updateUrlPreview();
    } catch (e) {
      // If URL is invalid, just update the form value
      this.requestForm.patchValue({ url: url }, { emitEvent: false });

      // Still update URL preview for variable replacement
      this.updateUrlPreview();
    }
  }

  onUrlBlur(): void {
    const urlControl = this.requestForm.get('url');
    if (urlControl) {
      const url = urlControl.value;
      if (url) {
        this.parseUrlParameters(url);
        this.updateUrlFromParams();
        this.updateUrlPreview();
      }
      if (url && url.trim() !== '' && !url.match(/^[a-z]+:\/\//)) {
        const updatedUrl = `${url}`;
        urlControl.setValue(updatedUrl, { emitEvent: true });
      }
    }
  }

  // Method moved to unified implementation

  /**
   * Loads saved tab data when switching tabs
   * @param tabId ID of the tab to load data from
   */
  loadTabData(tabId: string): void {
    // Find the tab in the tab service
    const tab = this.tabService.tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Update form values with tab properties
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

    // Update auth headers after loading data
    this.updateAuthHeaders();
    
    // Ensure an environment is active when switching tabs
    // (This preserves environment context across tabs without changing it)
    if (!this.activeEnvironmentId && this.environments && this.environments.length > 0) {
      // If no environment is currently active, activate the first one
      const defaultEnv = this.environments[0];
      this.changeEnvironment(defaultEnv.id);
    }

    // Update URL preview
    this.updateUrlPreview();

    // Load any existing response data for this tab
    this.responseData = this.responseService.getResponseForTab(tabId);

    this.cdr.detectChanges();
  }

  /**
   * Save the current tab data to the tab service when switching tabs
   * This ensures that tab state is preserved
   */
  private saveCurrentTabData(): void {
    if (!this.currentTabId) return;

    // Get form values including disabled controls
    const formValue = this.requestForm.getRawValue();

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

  // The saveCurrentTabData method has been moved above

  /**
   * Save the current request to the database
   * Always shows the save modal regardless of whether the request is new or existing
   * After modal confirmation, creates or updates the request based on parentId
   * For draft requests, uses targetType and targetId to determine save location
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
    
    // Log request details for debugging
    console.log('Tab parentId:', currentTab?.parentId);
    console.log('Tab targetId:', currentTab?.targetId);
    console.log('Current tab data:', currentTab);
    
    // Always open the save dialog, regardless of whether the request is new or existing
    // This allows users to edit the name or change the associated folder/collection

    // Open the save request modal dialog
    const dialogRef = this.dialog.open(SaveRequestModalComponent, {
      width: '500px',
      data: {
        workspaceId: this.workspaceId,
        // Pass current tab data for editing
        requestName: currentTab?.name || this.getRequestNameFromUrl(formValue.url),
        // If request was previously saved, provide existing location data
        // If it's a draft with targetId/targetType, use those as initial location
        location: currentTab?.parentId ? {
          id: currentTab.parentId,
          type: currentTab.parentType,
          isShared: currentTab.isShared
        } : (currentTab?.targetId ? {
          id: currentTab.targetId,
          type: currentTab.targetType,
          isShared: currentTab.isShared || false
        } : undefined)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return; // User canceled
      }
      
      // Check if this is a new request or an existing one based on parentId
      const isExistingRequest = currentTab?.parentId !== undefined;

      // Get the request name from the result or generate one from the URL
      const requestName = result.name || currentTab?.name || this.getRequestNameFromUrl(formValue.url);

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

      // Show loading indicator regardless of operation type
      const loadingSnackBarRef = this.snackBar.open(
        isExistingRequest ? 'Updating request...' : 'Saving request...', 
        '', 
        { duration: undefined }
      );

      // Handle collection or folder selection
      let collectionId: number | null = null;
      let folderId: number | null = null;
      let isShared: boolean = false;

      if (result.location) {
        const location: SaveLocation = result.location;
        isShared = location.isShared || false;

        if (location.type === 'collection') {
          collectionId = location.id;
          this.tabService.updateTabData(this.currentTabId!, {
            parentType: 'collection',
            parentId: isExistingRequest ? currentTab!.parentId : location.id,  // Preserve existing ID if updating
            name: requestName,
            isShared: isShared,
            // Clear targetType and targetId once the request is being saved
            targetType: undefined,
            targetId: undefined
          });
        } else if (location.type === 'folder') {
          folderId = location.id;
          this.tabService.updateTabData(this.currentTabId!, {
            parentType: 'folder',
            parentId: isExistingRequest ? currentTab!.parentId : location.id,  // Preserve existing ID if updating
            name: requestName,
            isShared: isShared,
            // Clear targetType and targetId once the request is being saved
            targetType: undefined,
            targetId: undefined
          });
        }
      }

      if (isExistingRequest && currentTab?.parentId) {
        // UPDATE EXISTING REQUEST
        // Create request update object with PascalCase properties for backend compatibility
        const requestToUpdate: any = {
          Id: currentTab.parentId, // Use parentId as the request ID
          Name: requestName,
          Url: formValue.url,
          HttpMethod: formValue.method,
          Headers: this.headers.reduce((obj: any, item) => {
            if (item.key && item.enabled) obj[item.key] = item.value;
            return obj;
          }, {}),
          Parameters: this.params.reduce((obj: any, item) => {
            if (item.key && item.enabled) obj[item.key] = item.value;
            return obj;
          }, {}),
          Body: formValue.body,
          CollectionId: collectionId || undefined,
          FolderId: folderId || undefined,
          IsShared: isShared
        };
        
        // Add authentication data if provided
        if (formValue.authType !== AuthType.NONE) {
          requestToUpdate.Authentication = {
            authType: formValue.authType,
            authData: {}
          };
          
          if (formValue.authType === AuthType.BASIC) {
            requestToUpdate.Authentication.authData = {
              'username': this.basicAuthUsername,
              'password': this.basicAuthPassword
            };
          } else if (formValue.authType === AuthType.BEARER) {
            requestToUpdate.Authentication.authData = {
              'token': this.bearerToken
            };
          }
        }
        
        // Update the existing request
        this.requestService.updateRequest(requestToUpdate).pipe(
          finalize(() => loadingSnackBarRef.dismiss())
        ).subscribe({
          next: (response: any) => {
            if (response.isSuccess) {
              this.snackBar.open('Request updated successfully', 'Close', { duration: 3000 });
              console.log('Request updated:', response.data);
            } else {
              const errorMessage = response.error || 'An unknown error occurred';
              this.snackBar.open(errorMessage, 'Dismiss', { 
                duration: 5000, 
                panelClass: ['error-snackbar'] 
              });
            }
          },
          error: (error: any) => {
            // Handle HTTP errors or other exceptions
            let errorMessage = 'An error occurred while communicating with the server';
            if (error.error && error.error.error) {
              // Extract error message from API response if available
              errorMessage = error.error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }
            this.snackBar.open(errorMessage, 'Dismiss', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            console.error('Error updating request:', error);
          }
        });
      } else {
        // CREATE NEW REQUEST
        // Convert form data to request DTO with PascalCase properties
        const requestDto = convertFormDataToRequest(requestFormData, requestName, collectionId || undefined, folderId || undefined, isShared);

        // Save as a new request
        this.requestService.saveRequest(requestDto).pipe(
          finalize(() => loadingSnackBarRef.dismiss())
        ).subscribe({
          next: (response: any) => {
            if (response.isSuccess && response.data) {
              this.snackBar.open('Request saved successfully', 'Close', { duration: 3000 });
              console.log('Request saved:', response.data);
              
              // Critical: Update the tab with the new request ID from the response
              // to ensure subsequent updates work correctly
              if (response.data.id) {
                const newRequestId = response.data.id;
                console.log(`Updating tab with new request ID: ${newRequestId}`);
                
                // Update tab data with the correct parentId after successful save
                this.tabService.updateTabData(this.currentTabId!, {
                  parentId: newRequestId,
                  // Make sure parentType is set correctly based on where it was saved
                  parentType: folderId ? 'folder' : 'collection',
                  // Keep the target properties cleared
                  targetId: undefined,
                  targetType: undefined
                });
              }
            } else {
              // Display only the specific error message from the backend without prefix
              const errorMessage = response.error || 'An unknown error occurred';
              this.snackBar.open(errorMessage, 'Dismiss', {
                duration: 7000,
                panelClass: ['error-snackbar']
              });
              console.error('Failed to save request:', errorMessage);
            }
          },
          error: (error: any) => {
            // Handle HTTP errors or other exceptions
            let errorMessage = 'An error occurred while communicating with the server';

            if (error.error && error.error.error) {
              // Extract error message from API response if available
              errorMessage = error.error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }

            // Display only the specific error message without prefix
            this.snackBar.open(errorMessage, 'Dismiss', {
              duration: 7000,
              panelClass: ['error-snackbar']
            });
            console.error('Error saving request:', error);
          }
        });
      }
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
      return 'Untitled Request';
    } catch (e) {
      // If we can't parse the URL, just use a generic name
      return 'Untitled Request';
    }
  }

  /**
   * Gets a display URL with the base URL and query string
   */
  getDisplayUrl(): string {
    const url = this.requestForm.get('url')?.value || '';
    const queryString = this.buildQueryString();
    return url + queryString;
  }

  /**
   * Updates the URL preview by replacing environment variables in the display URL
   */
  updateUrlPreview(): void {
    const displayUrl = this.getDisplayUrl();
    // Use the variable replacement service to replace variables in the URL
    // Pass isUrl=true so that variable replacement knows to handle URL variables differently
    this.urlPreview = this.variableReplacementService.replaceVariables(displayUrl, true);
  }

  /**
   * Detects if a string contains environment variables in {{variable}} format
   * @param text The text to check for variables
   * @returns true if variables are found, false otherwise
   */
  /**
   * Loads all available environments for the current workspace
   * @param workspaceId The ID of the current workspace
   * @param activateDefault Whether to activate the first environment by default
   */
  loadEnvironmentsForWorkspace(workspaceId: number, activateDefault: boolean = false): void {
    // Save the current active environment ID to restore it after reload if needed
    const previousActiveEnvId = this.activeEnvironmentId;
    
    this.environmentService.getEnvironmentsByWorkspaceId(workspaceId)
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.environments = response.data;
            
            // If there are environments and we should activate the default, use the first one
            if (activateDefault && this.environments.length > 0 && !this.activeEnvironmentId) {
              // Use the first environment available
              const defaultEnv = this.environments[0];
              this.changeEnvironment(defaultEnv.id);
            } 
            // If we're reloading and had a previous environment, try to restore it
            else if (!activateDefault && previousActiveEnvId && this.environments.length > 0) {
              // Check if the previously active environment still exists
              const envStillExists = this.environments.some(env => env.id === previousActiveEnvId);
              if (envStillExists) {
                // If it still exists, make sure it's still active (no need to change if it is)
                if (this.activeEnvironmentId !== previousActiveEnvId) {
                  this.changeEnvironment(previousActiveEnvId);
                }
              } else {
                // If the environment was deleted, select the first available one
                const defaultEnv = this.environments[0];
                this.changeEnvironment(defaultEnv.id);
              }
            }
            
            this.cdr.detectChanges();
          } else {
            console.error('Failed to load environments:', response.error);
          }
        },
        error: (error) => {
          console.error('Error loading environments:', error);
        }
      });
  }
  
  /**
   * Change the active environment
   * @param environmentId The ID of the environment to activate
   */
  changeEnvironment(environmentId: number | null): void {
    // Pass the environment ID only if it's a valid number (not 0 which means 'No Environment')
    const idToSet = environmentId && environmentId > 0 ? environmentId : null;
    this.variableReplacementService.setActiveEnvironment(idToSet);
  }
  
  hasEnvironmentVariables(text: string): boolean {
    return text ? /\{\{([^{}]+)\}\}/g.test(text) : false;
  }

  /**
   * Gets the variables used in a string
   * @param text The text to extract variables from
   * @returns Array of variable names without the {{ }} delimiters
   */
  getVariablesInText(text: string): string[] {
    if (!text) return [];
    return this.variableReplacementService.detectVariables(text);
  }
  
  /**
   * Creates a new tab and initializes it with the active environment
   * @param name Optional name for the new tab
   */
  createNewTab(name?: string): void {
    // Save current tab data before creating a new one
    if (this.currentTabId) {
      this.saveCurrentTabData();
    }

    // Create a new tab
    const newTab = this.tabService.createNewTab({ name: name || 'New Request' });
    this.currentTabId = newTab.id;
    this.responseService.setCurrentTabId(this.currentTabId);
    
    // Reset the form with default values
    this.requestForm.patchValue({
      url: '',
      method: HttpMethod.GET,
      body: '{\n  "key": "value"\n}',
      authType: AuthType.NONE,
      basicAuthUsername: '',
      basicAuthPassword: '',
      bearerToken: ''
    });
    
    // Reset params and headers
    this.params = [{ key: '', value: '', enabled: true }];
    this.headers = [{ key: '', value: '', enabled: true }];
    this.bodyType = 'json';
    this.responseData = null;
    
    // Make sure the active environment is still set
    // (We don't change it when creating a new tab to maintain environment context across tabs)
    if (!this.activeEnvironmentId && this.environments && this.environments.length > 0) {
      // If no environment is active yet, activate the first one
      const defaultEnv = this.environments[0];
      this.changeEnvironment(defaultEnv.id);
    }
    
    // Update the request URL preview
    this.updateUrlPreview();
    
    this.cdr.detectChanges();
  }

  /**
   * Checks if a specific variable is defined in the current environment
   * @param variableName Name of the variable to check
   * @returns true if the variable is defined, false otherwise
   */
  isVariableDefined(variableName: string): boolean {
    return this.variableReplacementService.isVariableDefined(variableName);
  }

  /**
   * Inserts a variable at the current cursor position in the URL input
   * @param variableName Name of the variable to insert
   */
  insertVariableInUrl(variableName: string): void {
    const urlControl = this.requestForm.get('url');
    if (!urlControl) return;

    const currentUrl = urlControl.value || '';
    const urlInput = document.getElementById('url-input') as HTMLInputElement;

    if (urlInput) {
      const cursorPos = urlInput.selectionStart || 0;
      const textBefore = currentUrl.substring(0, cursorPos);
      const textAfter = currentUrl.substring(cursorPos, currentUrl.length);

      // Insert variable without http:// prefix, just the variable token
      const newUrl = `${textBefore}{{${variableName}}}${textAfter}`;
      urlControl.setValue(newUrl, { emitEvent: true });

      // Set cursor position after the inserted variable
      setTimeout(() => {
        const newCursorPos = cursorPos + variableName.length + 4; // +4 for '{{}}'
        urlInput.setSelectionRange(newCursorPos, newCursorPos);
        urlInput.focus();
      }, 0);
    }
  }

  /**
   * Inserts a variable at the current cursor position in a header or param value
   * @param item The header or param object to update
   * @param variableName Name of the variable to insert
   * @param field 'key' or 'value' - which field to insert into
   */
  insertVariableInKeyValue(item: KeyValuePair, variableName: string, field: 'key' | 'value'): void {
    if (!item) return;

    const currentValue = item[field] || '';
    item[field] = `${currentValue}{{${variableName}}}`;

    // Update the auth headers if necessary
    this.updateAuthCredentials();
    this.cdr.detectChanges();
  }

  /**
   * Loads saved tab data when switching tabs
   * @param tabId ID of the tab to load data from
   */
  // This duplicate method has been removed and merged with the other implementation

  sendRequest(): void {
    if (this.requestForm.invalid) {
      return;
    }

    // Get the workspace ID from the route parameters first
    this.route.paramMap.pipe(
      take(1) // Take only the first emission and complete
    ).subscribe((params: ParamMap) => {
      const workspaceId = params.get('id');
      this.workspaceIdRoute = Number(workspaceId || '0');

      // Continue with the request after we have the workspace ID
      this.executeRequest(this.workspaceIdRoute);
    });
  }

  /* This duplicate getDisplayUrl method has been removed */

  /**
   * Process URL with query parameters
   */
  private processUrl(baseUrl: string): string {
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

  /**
   * Update URL from parameters
   */
  private updateUrlFromParams(): void {
    const urlControl = this.requestForm.get('url');
    if (urlControl) {
      const baseUrl = urlControl.value;
      const processedUrl = this.processUrl(baseUrl);
      urlControl.setValue(processedUrl, { emitEvent: false });
    }
  }

  /**
   * Parse URL parameters from a URL string
   */
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

  /**
   * Build query string from params
   */
  private buildQueryString(): string {
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

    return queryParams.toString() ? `?${queryParams.toString()}` : '';
  }

  /**
   * Update an existing request using its ID (which is stored as parentId)
   * @param requestId The ID of the request to update (same as parentId)
   * @param formValue Form data from the request editor
   * @param currentTab Current tab data containing metadata
   */
  private updateExistingRequestById(requestId: number, formValue: any, currentTab: any): void {
    // Show loading indicator
    const loadingSnackBarRef = this.snackBar.open('Updating request...', '', {
      duration: undefined
    });

    // Create a request update object with PascalCase properties for backend compatibility
    interface RequestUpdateData {
      Id: number;
      Name?: string;
      Url?: string;
      HttpMethod?: string;
      Headers?: {[key: string]: string};
      Parameters?: {[key: string]: string};
      Body?: any;
      CollectionId?: number;
      FolderId?: number;
      IsShared?: boolean;
      Authentication?: {
        authType: AuthType;
        authData: any;
      };
    }

    const requestToUpdate: RequestUpdateData = {
      Id: requestId, // Use the parentId as the request ID
      Name: currentTab?.name || this.getRequestNameFromUrl(formValue.url),
      Url: formValue.url,
      HttpMethod: formValue.method,
      Headers: this.headers.reduce((obj: any, item) => {
        if (item.key && item.enabled) obj[item.key] = item.value;
        return obj;
      }, {}),
      Parameters: this.params.reduce((obj: any, item) => {
        if (item.key && item.enabled) obj[item.key] = item.value;
        return obj;
      }, {}),
      Body: formValue.body,
      CollectionId: currentTab.parentType === 'collection' ? currentTab.parentId : undefined,
      FolderId: currentTab.parentType === 'folder' ? currentTab.parentId : undefined,
      IsShared: currentTab.isShared
    };

    // Add authentication data if provided
    if (formValue.authType !== AuthType.NONE) {
      requestToUpdate.Authentication = {
        authType: formValue.authType,
        authData: {}
      };
      
      if (formValue.authType === AuthType.BASIC) {
        requestToUpdate.Authentication.authData = {
          'username': this.basicAuthUsername,
          'password': this.basicAuthPassword
        };
      } else if (formValue.authType === AuthType.BEARER) {
        requestToUpdate.Authentication.authData = {
          'token': this.bearerToken
        };
      }
    }

    // Cast to any to handle PascalCase vs camelCase property mismatch with backend
    this.requestService.updateRequest(requestToUpdate as any).pipe(
      finalize(() => {
        loadingSnackBarRef.dismiss();
      })
    ).subscribe({
      next: (response: any) => {
        if (response.isSuccess) {
          // Update the tab metadata with latest values
          if (this.currentTabId) {
            this.tabService.updateTabData(this.currentTabId, {
              name: requestToUpdate.Name,
              url: requestToUpdate.Url,
              method: requestToUpdate.HttpMethod as HttpMethod,
              parentId: requestId, // Keep the parentId which is the request ID
              parentType: currentTab.parentType,
              isShared: requestToUpdate.IsShared
            });
          }

          this.snackBar.open('Request updated successfully', 'Close', { duration: 3000 });
        } else {
          const errorMessage = response.error || 'An unknown error occurred';
          this.snackBar.open(errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      },
      error: (error: any) => {
        // Handle error case
        let errorMessage = 'An error occurred while communicating with the server';
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        this.snackBar.open(errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
        console.error('Error updating request:', error);
      }
    });
  }

  private executeRequest(workspaceId: number): void {
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
      authData,
      workspaceId, // Pass the workspace ID from the route
      this.bodyType // Pass the body type
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
