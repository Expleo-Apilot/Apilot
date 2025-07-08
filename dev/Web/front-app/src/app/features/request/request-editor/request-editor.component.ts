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

  bodyType: 'none' | 'json' | 'text' | 'form' = 'json';
  selectedAuthType: AuthType = AuthType.NONE;
  basicAuthUsername: string = '';
  basicAuthPassword: string = '';
  bearerToken: string = '';

  currentTabId: string | null = null;
  private subscriptions: Subscription[] = [];

  bodyEditorOptions = {
    theme: 'vs-dark',
    language: 'json',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    folding: true,
    lineNumbers: 'on',
    roundedSelection: true,
    contextmenu: true,
    wordWrap: 'on'
  };

  workspaceId: number = 0;

  environmentVariables: { [key: string]: string } = {};
  activeEnvironmentId: number | null = null;
  urlPreview: string = '';

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

    this.updateBodyEditorLanguage(this.bodyType);

    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme === 'dark' ? 'vs-dark' : 'vs-light';
    this.setMonacoTheme(theme);

    const envVarsSubscription = this.variableReplacementService.getCurrentEnvironmentVariables()
      .subscribe(variables => {
        this.environmentVariables = variables;
        this.updateUrlPreview();
      });
    this.subscriptions.push(envVarsSubscription);

    const activeEnvSubscription = this.variableReplacementService.getActiveEnvironmentId()
      .subscribe(id => {
        this.activeEnvironmentId = id;
      });
    this.subscriptions.push(activeEnvSubscription);

    this.route.paramMap.pipe(
      take(1)
    ).subscribe((params: ParamMap) => {
      const workspaceId = params.get('id');
      if (workspaceId) {
        this.loadEnvironmentsForWorkspace(Number(workspaceId), true);

        const envChangesSubscription = this.environmentService.environmentsChanged$
          .subscribe(changedWorkspaceId => {
            if (changedWorkspaceId === Number(workspaceId)) {
              this.loadEnvironmentsForWorkspace(Number(workspaceId), false);
            }
          });
        this.subscriptions.push(envChangesSubscription);
      }
    });

    this.route.parent?.parent?.params.subscribe(params => {
      if (params['id']) {
        this.workspaceId = +params['id'];
      }
    });

    const urlSubscription = this.requestForm.get('url')?.valueChanges.subscribe((url) => {
      if (url) {
        this.parseUrlParameters(url);
        this.updateUrlPreview();
        this.saveCurrentTabData();
      }
      this.cdr.detectChanges();
    });

    if (urlSubscription) {
      this.subscriptions.push(urlSubscription);
    }

    const methodSubscription = this.requestForm.get('method')?.valueChanges.subscribe(() => {
      this.saveCurrentTabData();
    });

    if (methodSubscription) {
      this.subscriptions.push(methodSubscription);
    }

    const bodySubscription = this.requestForm.get('body')?.valueChanges.subscribe(() => {
      this.saveCurrentTabData();
    });

    if (bodySubscription) {
      this.subscriptions.push(bodySubscription);
    }

    const authTypeSubscription = this.requestForm.get('authType')?.valueChanges.subscribe(authType => {
      this.selectedAuthType = authType;
      this.updateAuthHeaders();
      this.saveCurrentTabData();
    });

    if (authTypeSubscription) {
      this.subscriptions.push(authTypeSubscription);
    }

    this.subscriptions.push(
      this.tabService.activeTabId$.subscribe(tabId => {
        if (tabId && tabId !== this.currentTabId) {
          if (this.currentTabId) {
            this.saveCurrentTabData();
          }
          this.currentTabId = tabId;
          this.responseService.setCurrentTabId(tabId);
          this.loadTabData(tabId);
        } else if (!tabId && this.tabService.tabs.length === 0) {
          this.currentTabId = this.tabService.createNewTab().id;
          this.responseService.setCurrentTabId(this.currentTabId);
        }
      })
    );

    if (this.tabService.activeTab) {
      this.currentTabId = this.tabService.activeTab.id;
      this.responseService.setCurrentTabId(this.currentTabId);
      this.loadTabData(this.currentTabId);
    } else if (this.tabService.tabs.length > 0) {
      this.currentTabId = this.tabService.tabs[0].id;
      this.responseService.setCurrentTabId(this.currentTabId);
      this.tabService.activateTab(this.currentTabId);
    } else {
      const lastSelectedRequest = this.tabService.getSelectedRequestDetails();
      if (lastSelectedRequest) {
        this.currentTabId = this.tabService.createNewTab({
          name: lastSelectedRequest.name,
          url: lastSelectedRequest.url,
          method: lastSelectedRequest.method,
          params: lastSelectedRequest.params,
          headers: lastSelectedRequest.headers,
          body: lastSelectedRequest.body,
          bodyType: lastSelectedRequest.bodyType,
          authType: lastSelectedRequest.authType,
          basicAuthUsername: lastSelectedRequest.basicAuthUsername,
          basicAuthPassword: lastSelectedRequest.basicAuthPassword,
          bearerToken: lastSelectedRequest.bearerToken,
          parentId: lastSelectedRequest.parentId,
          parentType: lastSelectedRequest.parentType,
          isShared: lastSelectedRequest.isShared
        }).id;
      } else {
        this.currentTabId = this.tabService.createNewTab().id;
      }
      this.responseService.setCurrentTabId(this.currentTabId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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

    this.requestForm.get('method')?.valueChanges.subscribe(method => {
      if (method === HttpMethod.GET) {
        this.requestForm.get('body')?.disable();
      } else {
        this.requestForm.get('body')?.enable();
      }
    });

    this.requestForm.get('authType')?.valueChanges.subscribe(authType => {
      this.selectedAuthType = authType;
      this.updateAuthHeaders();
    });
  }

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
        language = 'plaintext';
        break;
      case 'none':
      default:
        language = 'plaintext';
        break;
    }
    this.bodyEditorOptions = { ...this.bodyEditorOptions, language: language };
  }

  setMonacoTheme(theme: 'vs-light' | 'vs-dark') {
    this.bodyEditorOptions = {
      ...this.bodyEditorOptions,
      theme
    };
  }

  updateAuthHeaders(): void {
    const manualAuthHeader = this.headers.find(h =>
      h.key.toLowerCase() === 'authorization' &&
      this.selectedAuthType === AuthType.NONE
    );

    if (this.selectedAuthType !== AuthType.NONE) {
      this.headers = this.headers.filter(h =>
        h.key.toLowerCase() !== 'authorization' &&
        h.key.toLowerCase() !== 'x-api-key'
      );
    }

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
        break;

      case AuthType.OAUTH2:
        break;

      case AuthType.NONE:
      default:
        if (manualAuthHeader) {
          this.headers = this.headers.filter(h => h.key.toLowerCase() !== 'authorization');
          this.headers.unshift(manualAuthHeader);
        }
        break;
    }
  }

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

  addHeader(): void {
    this.headers.push({ key: '', value: '', enabled: true });
    this.saveCurrentTabData();
  }

  removeHeader(index: number): void {
    if (this.headers.length === 1) {
      this.headers[0] = { key: '', value: '', enabled: true };
    } else {
      this.headers.splice(index, 1);
    }

    this.updateAuthHeaders();

    this.saveCurrentTabData();
  }

  onHeaderChange(header: KeyValuePair): void {
    if (header.key.toLowerCase() === 'authorization') {
      const value = header.value.trim();

      if (value.startsWith('Basic ')) {
        this.requestForm.get('authType')?.setValue(AuthType.BASIC);
      } else if (value.startsWith('Bearer ')) {
        this.requestForm.get('authType')?.setValue(AuthType.BEARER);
        this.requestForm.get('bearerToken')?.setValue(value.substring(7));
      }
    }

    this.saveCurrentTabData();

    this.cdr.detectChanges();
  }

  addParam(): void {
    this.params.push({ key: '', value: '', enabled: true });
    this.cdr.detectChanges();
  }

  removeParam(index: number): void {
    if (this.params.length === 1) {
      this.params[0] = { key: '', value: '', enabled: true };
    } else {
      this.params.splice(index, 1);
    }

    this.saveCurrentTabData();
  }

  onUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const url = input.value;

    try {
      const urlObj = new URL(url);
      const baseUrl = urlObj.origin + urlObj.pathname;

      this.requestForm.patchValue({ url: baseUrl }, { emitEvent: false });

      this.parseUrlParameters(url);

      this.updateUrlPreview();
    } catch (e) {
      this.requestForm.patchValue({ url: url }, { emitEvent: false });

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

  loadTabData(tabId: string): void {
    const tab = this.tabService.tabs.find(t => t.id === tabId);
    if (!tab) return;

    this.currentTabId = tabId;

    this.requestForm.patchValue({
      url: tab.url,
      method: tab.method,
      body: tab.body,
      authType: tab.authType,
      basicAuthUsername: tab.basicAuthUsername,
      basicAuthPassword: tab.basicAuthPassword,
      bearerToken: tab.bearerToken
    }, { emitEvent: false });

    this.headers = [...tab.headers];
    this.params = [...tab.params];
    this.bodyType = tab.bodyType;
    this.selectedAuthType = tab.authType;
    this.basicAuthUsername = tab.basicAuthUsername;
    this.basicAuthPassword = tab.basicAuthPassword;
    this.bearerToken = tab.bearerToken;

    this.updateBodyEditorLanguage(this.bodyType);

    if (tab.method === HttpMethod.GET) {
      this.requestForm.get('body')?.disable({ emitEvent: false });
    } else {
      this.requestForm.get('body')?.enable({ emitEvent: false });
    }

    this.updateAuthHeaders();

    if (!this.activeEnvironmentId && this.environments && this.environments.length > 0) {
      const defaultEnv = this.environments[0];
      this.changeEnvironment(defaultEnv.id);
    }

    this.updateUrlPreview();

    this.responseData = this.responseService.getResponseForTab(tabId);

    this.cdr.detectChanges();
  }

  saveCurrentTabData(): void {
    if (!this.currentTabId) return;

    const formValue = this.requestForm.getRawValue();

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
      parentId: currentTab?.parentId,
      parentType: currentTab?.parentType
    });
  }

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

    const dialogRef = this.dialog.open(SaveRequestModalComponent, {
      width: '500px',
      data: {
        workspaceId: this.workspaceId,
        requestName: currentTab?.name || this.getRequestNameFromUrl(formValue.url),
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
        return;
      }

      const isExistingRequest = currentTab?.parentId !== undefined;

      const requestName = result.name || currentTab?.name || this.getRequestNameFromUrl(formValue.url);

      const requestFormData: RequestFormData = {
        url: formValue.url,
        method: formValue.method,
        params: this.params.filter(p => p.key.trim() !== ''),
        headers: this.headers.filter(h => h.key.trim() !== ''),
        body: formValue.body,
        authType: formValue.authType,
        authData: {}
      };

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

      const loadingSnackBarRef = this.snackBar.open(
        isExistingRequest ? 'Updating request...' : 'Saving request...', 
        '', 
        { duration: undefined }
      );

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
            parentId: isExistingRequest ? currentTab!.parentId : location.id,
            name: requestName,
            isShared: isShared,
            targetType: undefined,
            targetId: undefined
          });
        } else if (location.type === 'folder') {
          folderId = location.id;
          this.tabService.updateTabData(this.currentTabId!, {
            parentType: 'folder',
            parentId: isExistingRequest ? currentTab!.parentId : location.id,
            name: requestName,
            isShared: isShared,
            targetType: undefined,
            targetId: undefined
          });
        }
      }

      if (isExistingRequest && currentTab?.parentId) {
        const requestToUpdate: any = {
          Id: currentTab.parentId,
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

        this.requestService.updateRequest(requestToUpdate).pipe(
          finalize(() => loadingSnackBarRef.dismiss())
        ).subscribe({
          next: (response: any) => {
            if (response.isSuccess) {
              this.snackBar.open('Request updated successfully', 'Close', { duration: 3000 });
            } else {
              const errorMessage = response.error || 'An unknown error occurred';
              this.snackBar.open(errorMessage, 'Dismiss', { 
                duration: 5000, 
                panelClass: ['error-snackbar'] 
              });
            }
          },
          error: (error: any) => {
            let errorMessage = 'An error occurred while communicating with the server';
            if (error.error && error.error.error) {
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
        const requestDto = convertFormDataToRequest(requestFormData, requestName, collectionId || undefined, folderId || undefined, isShared);

        this.requestService.saveRequest(requestDto).pipe(
          finalize(() => loadingSnackBarRef.dismiss())
        ).subscribe({
          next: (response: any) => {
            if (response.isSuccess && response.data) {
              this.snackBar.open('Request saved successfully', 'Close', { duration: 3000 });

              if (response.data.id) {
                const newRequestId = response.data.id;
                console.log(`Updating tab with new request ID: ${newRequestId}`);

                this.tabService.updateTabData(this.currentTabId!, {
                  parentId: newRequestId,
                  parentType: folderId ? 'folder' : 'collection',
                  targetId: undefined,
                  targetType: undefined
                });
              }
            } else {
              const errorMessage = response.error || 'An unknown error occurred';
              this.snackBar.open(errorMessage, 'Dismiss', {
                duration: 7000,
                panelClass: ['error-snackbar']
              });
              console.error('Failed to save request:', errorMessage);
            }
          },
          error: (error: any) => {
            let errorMessage = 'An error occurred while communicating with the server';

            if (error.error && error.error.error) {
              errorMessage = error.error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }

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

  getRequestNameFromUrl(url: string): string {
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
      return 'Untitled Request';
    }
  }

  getDisplayUrl(): string {
    const url = this.requestForm.get('url')?.value || '';
    const queryString = this.buildQueryString();
    return url + queryString;
  }

  updateUrlPreview(): void {
    const displayUrl = this.getDisplayUrl();
    this.urlPreview = this.variableReplacementService.replaceVariables(displayUrl, true);
  }

  loadEnvironmentsForWorkspace(workspaceId: number, activateDefault: boolean = false): void {
    const previousActiveEnvId = this.activeEnvironmentId;

    this.environmentService.getEnvironmentsByWorkspaceId(workspaceId)
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.environments = response.data;

            if (activateDefault && this.environments.length > 0 && !this.activeEnvironmentId) {
              const defaultEnv = this.environments[0];
              this.changeEnvironment(defaultEnv.id);
            } else if (!activateDefault && previousActiveEnvId && this.environments.length > 0) {
              const envStillExists = this.environments.some(env => env.id === previousActiveEnvId);
              if (envStillExists) {
                if (this.activeEnvironmentId !== previousActiveEnvId) {
                  this.changeEnvironment(previousActiveEnvId);
                }
              } else {
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

  changeEnvironment(environmentId: number | null): void {
    const idToSet = environmentId && environmentId > 0 ? environmentId : null;
    this.variableReplacementService.setActiveEnvironment(idToSet);
  }

  hasEnvironmentVariables(text: string): boolean {
    return text ? /\{\{([^{}]+)\}\}/g.test(text) : false;
  }

  getVariablesInText(text: string): string[] {
    if (!text) return [];
    return this.variableReplacementService.detectVariables(text);
  }

  createNewTab(name?: string): void {
    if (this.currentTabId) {
      this.saveCurrentTabData();
    }

    const newTab = this.tabService.createNewTab({ name: name || 'New Request' });
    this.currentTabId = newTab.id;
    this.responseService.setCurrentTabId(this.currentTabId);

    this.requestForm.patchValue({
      url: '',
      method: HttpMethod.GET,
      body: '{\n  "key": "value"\n}',
      authType: AuthType.NONE,
      basicAuthUsername: '',
      basicAuthPassword: '',
      bearerToken: ''
    });

    this.params = [{ key: '', value: '', enabled: true }];
    this.headers = [{ key: '', value: '', enabled: true }];
    this.bodyType = 'json';
    this.responseData = null;

    if (!this.activeEnvironmentId && this.environments && this.environments.length > 0) {
      const defaultEnv = this.environments[0];
      this.changeEnvironment(defaultEnv.id);
    }

    this.updateUrlPreview();

    this.cdr.detectChanges();
  }

  isVariableDefined(variableName: string): boolean {
    return this.variableReplacementService.isVariableDefined(variableName);
  }

  insertVariableInUrl(variableName: string): void {
    const urlControl = this.requestForm.get('url');
    if (!urlControl) return;

    const currentUrl = urlControl.value || '';
    const urlInput = document.getElementById('url-input') as HTMLInputElement;

    if (urlInput) {
      const cursorPos = urlInput.selectionStart || 0;
      const textBefore = currentUrl.substring(0, cursorPos);
      const textAfter = currentUrl.substring(cursorPos, currentUrl.length);

      const newUrl = `${textBefore}{{${variableName}}}${textAfter}`;
      urlControl.setValue(newUrl, { emitEvent: true });

      setTimeout(() => {
        const newCursorPos = cursorPos + variableName.length + 4;
        urlInput.setSelectionRange(newCursorPos, newCursorPos);
        urlInput.focus();
      }, 0);
    }
  }

  insertVariableInKeyValue(item: KeyValuePair, variableName: string, field: 'key' | 'value'): void {
    if (!item) return;

    const currentValue = item[field] || '';
    item[field] = `${currentValue}{{${variableName}}}`;

    this.updateAuthCredentials();
    this.cdr.detectChanges();
  }

  sendRequest(): void {
    if (this.requestForm.invalid) {
      return;
    }

    this.route.paramMap.pipe(
      take(1)
    ).subscribe((params: ParamMap) => {
      const workspaceId = params.get('id');
      this.workspaceIdRoute = Number(workspaceId || '0');

      this.executeRequest(this.workspaceIdRoute);
    });
  }

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
      return baseUrl + queryString;
    }
  }

  private updateUrlFromParams(): void {
    const urlControl = this.requestForm.get('url');
    if (urlControl) {
      const baseUrl = urlControl.value;
      const processedUrl = this.processUrl(baseUrl);
      urlControl.setValue(processedUrl, { emitEvent: false });
    }
  }

  private parseUrlParameters(url: string): void {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);

      this.params = [];

      searchParams.forEach((value, key) => {
        this.params.push({
          key: key,
          value: value,
          enabled: true
        });
      });

      if (this.params.length === 0) {
        this.params.push({ key: '', value: '', enabled: true });
      }

      this.cdr.detectChanges();
    } catch (e) {
      console.log('Invalid URL format');
    }
  }

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

  private updateExistingRequestById(requestId: number, formValue: any, currentTab: any): void {
    const loadingSnackBarRef = this.snackBar.open('Updating request...', '', {
      duration: undefined
    });

    const requestToUpdate: any = {
      Id: requestId,
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

    this.requestService.updateRequest(requestToUpdate).pipe(
      finalize(() => loadingSnackBarRef.dismiss())
    ).subscribe({
      next: (response: any) => {
        if (response.isSuccess) {
          this.tabService.updateTabData(this.currentTabId!, {
            name: requestToUpdate.Name,
            url: requestToUpdate.Url,
            method: requestToUpdate.HttpMethod as HttpMethod,
            parentId: requestId,
            parentType: currentTab.parentType
          });

          this.snackBar.open('Request updated successfully', 'Close', { duration: 3000 });
        } else {
          const errorMessage = response.error || 'An unknown error occurred';
          this.snackBar.open(errorMessage, 'Dismiss', { 
            duration: 5000, 
            panelClass: ['error-snackbar'] 
          });
        }
      },
      error: (error: any) => {
        let errorMessage = 'An error occurred while communicating with the server';
        if (error.error && error.error.error) {
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
  }

  private executeRequest(workspaceId: number): void {
    this.isLoading = true;
    this.responseData = null;

    if (this.currentTabId) {
      this.responseService.clearResponseData(this.currentTabId);
    } else {
      this.responseService.clearResponseData();
    }

    this.updateAuthCredentials();

    const formValue = this.requestForm.getRawValue();
    let body = null;

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
          break;

        case AuthType.OAUTH2:
          break;
      }
    }

    const processedUrl = this.processUrl(formValue.url);

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
      body = formValue.body;
    }

    const validHeaders = this.headers.filter(h => h.key.trim() !== '' && h.enabled);

    this.httpClientService.sendRequest(
      processedUrl,
      formValue.method,
      validHeaders,
      this.params.filter(p => p.key.trim() !== '' && p.enabled),
      body,
      authData,
      this.workspaceId,
      this.bodyType
    ).subscribe({
      next: (response) => {
        this.responseData = response;
        this.isLoading = false;

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

        if (this.currentTabId) {
          this.responseService.updateResponseData(this.responseData, this.currentTabId);
        } else {
          this.responseService.updateResponseData(this.responseData);
        }
      }
    });
  }
}
