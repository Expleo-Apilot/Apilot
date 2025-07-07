// src/app/layout/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, forkJoin } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

// Services
import { WorkspaceService } from '../../core/services/workspace.service';
import { EnvironmentService } from '../../core/services/environment.service';
import { VariableReplacementService } from '../../core/services/variable-replacement.service';
import { CollectionService } from '../../core/services/collection.service';
import { RequestService } from '../../core/services/request.service';
import { FolderService } from '../../core/services/folder.service';
import { TabService } from '../../core/services/tab.service';
import { HistoryService } from '../../core/services/history.service';
import { CollectionImportService } from '../../core/services/collection-import.service';
import { CollaborationService } from '../../core/services/collaboration.service';

// Models
import { Workspace } from '../../core/models/workspace.model';
import { Environment, 
  CreateEnvironmentRequest, 
  UpdateEnvironmentRequest,
  AddVariableToEnvironmentRequest,
  UpdateVariableInEnvironmentRequest,
  RemoveVariableFromEnvironmentRequest 
} from '../../core/models/environment.model';
import { Collection, ApiResponse, CreateCollectionRequest } from '../../core/models/collection.model';
import { Request, KeyValuePair, Authentication } from '../../core/models/request.model';
import { AuthType } from '../../core/models/auth-type.enum';
import { Folder, CreateFolderRequest } from '../../core/models/folder.model';
import { HttpMethod } from '../../core/models/http-method.enum';

// Define a type for the navigation items
type NavItem = 'collections' | 'environments' | 'flows' | 'history';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css', './environment-variables.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Subscription management
  private subscriptions = new Subscription();

  // Navigation state
  activeNavItem: NavItem = 'collections';
  showCollectionsMenu = false;
  menuPosition = { top: '0px', left: '0px' };

  // History properties
  histories: any[] = [];
  filteredHistories: any[] = [];
  groupedHistories: { [key: string]: any[] } = {};
  historySearchTerm: string = '';

  // Environment properties
  environments: Environment[] = [];
  filteredEnvironments: Environment[] = [];
  environmentSearchTerm = '';
  showEnvironmentsMenu = false;
  activeEnvironmentId: number | null = null;
  showNewEnvironmentModal = false;
  showEditEnvironmentModal = false;
  showDeleteEnvironmentModal = false;
  showEnvironmentVariablesModal = false;
  currentEnvironment: Environment | null = null;
  newEnvironment = {
    name: '',
    workSpaceId: 0
  };
  newVariable = {
    key: '',
    value: ''
  };
  environmentVariables: {key: string, value: string}[] = [];

  // Make Object available to the template
  Object = Object;

  // Item context menu properties
  showItemMenu = false;
  itemMenuPosition = { top: '0px', left: '0px' };
  activeItemType: 'collection' | 'folder' | 'request' | null = null;
  activeItemId: number | null = null;

  // Modal states
  showNewCollectionModal = false;
  showEditCollectionModal = false;
  showDeleteConfirmModal = false;
  showNewFolderModal = false;
  showEditFolderModal = false;
  showDeleteFolderModal = false;
  showDeleteRequestModal = false;
  showImportCollectionModal = false;
  importCollectionUrl = '';
  isImporting = false;
  importError = '';
  currentCollection: Collection | null = null;
  currentCollectionId: number | null = null;
  currentFolder: Folder | null = null;
  currentRequest: Request | null = null;
  newCollection = {
    name: '',
    description: ''
  };
  newFolder = {
    name: ''
  };
  editFolder = {
    id: 0,
    name: '',
    collectionId: 0
  };
  editCollection = {
    id: 0,
    name: '',
    description: ''
  };
  collections!: Collection[];
  filteredCollections!: Collection[];
  sharedCollections!: Collection[];
  filteredSharedCollections!: Collection[];
  collectionForm! : CreateCollectionRequest;
  workspaceId: number = 1; // You should get this from your workspace service or route
  searchTerm: string = '';

  expandedItems: Set<number> = new Set();
  expandedCollections: Set<number> = new Set();
  expandedFolders: Set<number> = new Set();
  draggedItem: any = null;

  // ViewChild reference to file input element
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private environmentService: EnvironmentService,
    private collectionService: CollectionService,
    private requestService: RequestService,
    private folderService: FolderService,
    private collaborationService: CollaborationService,
    private collectionImportService: CollectionImportService,
    private tabService: TabService,
    private historyService: HistoryService,
    private snackBar: MatSnackBar,
    private variableReplacementService: VariableReplacementService
  ) {}

  ngOnInit() {
    // Track previous workspace ID to detect changes
    let previousWorkspaceId: number | null = null;
    
    // Subscribe to route params to get workspace ID
    const routeSub = this.route.params.subscribe(params => {
      const id = +params['id'];
      const environmentId = params['environmentId'];
      
      if (id) {
        // Check if workspace has changed (not first load)
        if (previousWorkspaceId !== null && previousWorkspaceId !== id) {
          console.log(`Workspace changed from ${previousWorkspaceId} to ${id}, closing all tabs`);
          this.tabService.closeAllTabs();
        }
        
        // Update current workspace ID
        this.workspaceId = id;
        previousWorkspaceId = id;
        console.log('Workspace ID from route:', this.workspaceId);
        
        // Check if we're navigating to an environment
        if (environmentId) {
          // Make sure we're in the environments section
          this.activeNavItem = 'environments';
          this.loadEnvironments();
          // Load the specific environment details
          this.loadEnvironmentDetails(+environmentId);
        } else {
          this.loadCollections();
          this.loadEnvironments();
          this.loadHistories();
        }
      }
    });
    this.subscriptions.add(routeSub);
    
    // Subscribe to history changes to update the UI automatically
    const historySub = this.historyService.historiesChanged$.subscribe(() => {
      this.loadHistories();
    });
    this.subscriptions.add(historySub);

    // Initialize your collectionForm properly here to avoid undefined errors
    this.collectionForm = {
      name: '',
      description: '',
      workSpaceId: 0
    };

    // Subscribe to request changes to update the UI automatically
    const requestChangeSub = this.requestService.requestsChanged$.subscribe(change => {
      console.log('Request change detected:', change);
      if (change.action !== 'init') {
        // Reload collections when a request is created, updated, or deleted
        this.loadCollections();
      }
    });
    this.subscriptions.add(requestChangeSub);
  }


  // Toggle the collections dropdown menu
  toggleCollectionsMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Get the button element that was clicked
    const button = (event.currentTarget || event.target) as HTMLElement;
    if (!button) return;

    // Get the button's position relative to the viewport
    const buttonRect = button.getBoundingClientRect();
    const sidebarContainer = document.querySelector('.sidebar-container');
    if (!sidebarContainer) return;

    const sidebarRect = sidebarContainer.getBoundingClientRect();

    // Calculate available space
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceRight = viewportWidth - buttonRect.left;

    // Menu dimensions
    const menuWidth = 220; // Width from CSS
    const menuHeight = 200; // Approximate height

    // Calculate optimal position
    let top = buttonRect.bottom;
    let left = Math.max(sidebarRect.left, buttonRect.left);

    // Adjust vertical position if needed
    if (spaceBelow < menuHeight) {
      top = Math.max(0, buttonRect.top - menuHeight);
    }

    // Adjust horizontal position if needed
    if (spaceRight < menuWidth) {
      left = Math.max(sidebarRect.left, buttonRect.right - menuWidth);
    }

    this.showCollectionsMenu = !this.showCollectionsMenu;
    this.showItemMenu = false;
    this.showEnvironmentsMenu = false;
    
    if (this.showCollectionsMenu) {
      // Position the menu relative to the click
      this.menuPosition = {
        top: `${event.clientY}px`,
        left: `${event.clientX}px`
      };
      
      // Add a click listener to close the menu when clicking outside
      setTimeout(() => {
        document.addEventListener('click', this.closeCollectionsMenu);
      });
    } else {
      document.removeEventListener('click', this.closeCollectionsMenu);
    }
  }
  
  toggleEnvironmentsMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showEnvironmentsMenu = !this.showEnvironmentsMenu;
    this.showCollectionsMenu = false;
    this.showItemMenu = false;
    
    if (this.showEnvironmentsMenu) {
      // Position the menu relative to the click
      this.menuPosition = {
        top: `${event.clientY}px`,
        left: `${event.clientX}px`
      };
      
      // Add a click listener to close the menu when clicking outside
      setTimeout(() => {
        document.addEventListener('click', this.closeEnvironmentsMenu);
      });
    } else {
      document.removeEventListener('click', this.closeEnvironmentsMenu);
    }
  }

  /**
   * Close the environments menu
   */
  closeEnvironmentsMenu = () => {
    this.showEnvironmentsMenu = false;
    document.removeEventListener('click', this.closeEnvironmentsMenu);
  };
  
  importEnvironment(): void {
    console.log('Environment import functionality to be implemented');
  }
  
  /**
   * Sets an environment as active for variable replacement
   * @param environmentId The environment ID to set as active
   */
  setActiveEnvironment(environmentId: number): void {
    if (!environmentId) return;
    
    // Update the activeEnvironmentId in the component
    this.activeEnvironmentId = environmentId;
    
    // Update the active environment in the variable replacement service
    // This enables dynamic variable replacement in requests
    this.variableReplacementService.setActiveEnvironment(environmentId);
    
    console.log(`Set active environment: ${environmentId} for variable replacement`);
    
    // Show success notification to the user
    this.snackBar.open('Environment activated for variable replacement', 'Close', { 
      duration: 3000,
      panelClass: 'success-snackbar'
    });
  }

  /**
   * Handle environment click to directly open the variables modal
   * @param environmentId The ID of the environment to select
   * @param event Optional mouse event
   */
  navigateToEnvironment(environmentId: number, event?: MouseEvent): void {
    // Prevent event propagation to parent elements
    if (event) {
      event.stopPropagation();
    }
    
    // Make sure we're in the environments section before navigating
    if (this.activeNavItem !== 'environments') {
      this.setActiveNavItem('environments');
    }
    
    // Update the URL to reflect the selected environment
    this.router.navigate(['/workspace', this.workspaceId, 'environment', environmentId], {
      replaceUrl: false,
      skipLocationChange: false,
      queryParamsHandling: 'preserve'
    });
    
    // Open the environment variables modal with the selected environment
    this.openEnvironmentVariablesModal(environmentId);
  }

  closeCollectionsMenu() {
    this.showCollectionsMenu = false;
    document.removeEventListener('click', this.closeCollectionsMenuOnClickOutside);
  }

  /**
   * Load environment details without changing the view
   * @param environmentId The ID of the environment to load details for
   */
  loadEnvironmentDetails(environmentId: number): void {
    if (!environmentId) return;

    this.environmentService.getEnvironmentById(environmentId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.currentEnvironment = response.data;
          console.log('Environment details loaded:', this.currentEnvironment);
        } else {
          console.error('Error loading environment details:', response.error);
        }
      },
      error: (error: any) => {
        console.error('Error loading environment details:', error);
      }
    });
  }
  
  /**
   * Opens the environment variables modal and loads environment details
   * @param environmentId The ID of the environment to open variables for
   */
  openEnvironmentVariablesModal(environmentId: number): void {
    if (!environmentId) return;
    
    // Store the environment ID (without setting it as active for variable replacement)
    this.activeEnvironmentId = environmentId;
    
    this.environmentService.getEnvironmentById(environmentId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.currentEnvironment = response.data;
          
          // Convert environment variables object to array for easier UI manipulation
          this.environmentVariables = [];
          if (this.currentEnvironment.variables) {
            for (const [key, value] of Object.entries(this.currentEnvironment.variables)) {
              this.environmentVariables.push({ key, value });
            }
          }
          
          // Reset the new variable form
          this.newVariable = { key: '', value: '' };
          
          // Show the modal
          this.showEnvironmentVariablesModal = true;
        } else {
          this.snackBar.open('Error loading environment details', 'Close', { duration: 3000 });
          console.error('Error loading environment details:', response.error);
        }
      },
      error: (error: any) => {
        this.snackBar.open('Error loading environment details', 'Close', { duration: 3000 });
        console.error('Error loading environment details:', error);
      }
    });
  }
  
  /**
   * Close the environment variables modal
   */
  closeEnvironmentVariablesModal(): void {
    this.showEnvironmentVariablesModal = false;
    this.environmentVariables = [];
    this.newVariable = { key: '', value: '' };
  }
  
  /**
   * Add a new environment variable to the list and persist it to the database
   */
  addEnvironmentVariable(): void {
    if (!this.currentEnvironment) {
      return;
    }
    
    // Validate the key is not empty
    const trimmedKey = this.newVariable.key.trim();
    if (!trimmedKey) {
      this.snackBar.open('Variable key cannot be empty', 'Close', { duration: 3000 });
      return;
    }
    
    // Check for duplicate keys
    const isDuplicate = this.environmentVariables.some(v => v.key === trimmedKey);
    if (isDuplicate) {
      this.snackBar.open('Variable key already exists', 'Close', { duration: 3000 });
      return;
    }
    
    // Create request to add variable to environment
    const request: AddVariableToEnvironmentRequest = {
      environmentId: this.currentEnvironment.id,
      key: trimmedKey,
      value: this.newVariable.value || ''
    };
    
    // Show loading indicator
    const loadingRef = this.snackBar.open('Adding variable...', '', { duration: undefined });
    
    // Call API to add variable
    this.environmentService.addVariableToEnvironment(request).subscribe({
      next: (response) => {
        loadingRef.dismiss();
        
        if (response.isSuccess) {
          // Reset the form
          this.newVariable = { key: '', value: '' };
          
          this.snackBar.open('Variable added successfully', 'Close', { duration: 3000 });
          
          // Reload the environment to get the latest data
          this.reloadCurrentEnvironment();
          // Also refresh the environments list
          this.loadEnvironments();
        } else {
          this.snackBar.open(`Error adding variable: ${response.error || 'Unknown error'}`, 'Close', { duration: 3000 });
          console.error('Error adding variable:', response.error);
        }
      },
      error: (error) => {
        loadingRef.dismiss();
        this.snackBar.open('Error adding variable', 'Close', { duration: 3000 });
        console.error('Error adding variable:', error);
      }
    });
  }
  
  /**
   * Reload the current environment data from the database
   */
  reloadCurrentEnvironment(): void {
    if (!this.currentEnvironment) {
      return;
    }
    
    this.environmentService.getEnvironmentById(this.currentEnvironment.id).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.currentEnvironment = response.data;
          
          // Convert environment variables object to array for UI
          this.environmentVariables = [];
          if (this.currentEnvironment.variables) {
            for (const [key, value] of Object.entries(this.currentEnvironment.variables)) {
              this.environmentVariables.push({ key, value });
            }
          }
        } else {
          console.error('Error reloading environment:', response.error);
        }
      },
      error: (error) => {
        console.error('Error reloading environment:', error);
      }
    });
  }
  
  /**
   * Remove an environment variable from the list and persist the change
   * @param index The index of the variable to remove
   */
  removeEnvironmentVariable(index: number): void {
    if (!this.currentEnvironment || index < 0 || index >= this.environmentVariables.length) {
      return;
    }
    
    const variableToRemove = this.environmentVariables[index];
    
    // Create request to remove variable from environment
    const request: RemoveVariableFromEnvironmentRequest = {
      environmentId: this.currentEnvironment.id,
      key: variableToRemove.key
    };
    
    // Show loading indicator
    const loadingRef = this.snackBar.open('Removing variable...', '', { duration: undefined });
    
    // Call API to remove variable
    this.environmentService.removeVariableFromEnvironment(request).subscribe({
      next: (response) => {
        loadingRef.dismiss();
        
        if (response.isSuccess) {
          this.snackBar.open('Variable removed successfully', 'Close', { duration: 3000 });
          
          // Reload the environment to get the latest data
          this.reloadCurrentEnvironment();
          // Also refresh the environments list
          this.loadEnvironments();
        } else {
          this.snackBar.open(`Error removing variable: ${response.error || 'Unknown error'}`, 'Close', { duration: 3000 });
          console.error('Error removing variable:', response.error);
        }
      },
      error: (error) => {
        loadingRef.dismiss();
        this.snackBar.open('Error removing variable', 'Close', { duration: 3000 });
        console.error('Error removing variable:', error);
      }
    });
  }
  
  /**
   * Update an environment variable
   * @param index The index of the variable to update
   */
  updateEnvironmentVariable(index: number): void {
    if (!this.currentEnvironment || index < 0 || index >= this.environmentVariables.length) {
      console.log('Invalid environment or index:', { currentEnvironment: !!this.currentEnvironment, index });
      return;
    }
    
    const variable = this.environmentVariables[index];
    const originalKey = this.getOriginalKeyFromCurrentEnvironment(index);
    const isKeyChanged = originalKey !== variable.key.trim();
    
    console.log('Updating variable:', { index, variable, originalKey, isKeyChanged });
    
    // Validate the key is not empty
    if (!variable.key.trim()) {
      this.snackBar.open('Variable key cannot be empty', 'Close', { duration: 3000 });
      return;
    }
    
    // Check for duplicate keys (excluding the current variable)
    const isDuplicate = this.environmentVariables.some((v, i) => 
      i !== index && v.key.trim() === variable.key.trim()
    );
    
    if (isDuplicate) {
      this.snackBar.open('Variable key already exists', 'Close', { duration: 3000 });
      return;
    }
    
    // If key has changed, we need to remove the old key and add the new one
    if (isKeyChanged && originalKey) {
      console.log('Key has changed, removing old key and adding new one');
      this.handleKeyChange(originalKey, variable.key.trim(), variable.value || '');
      return;
    }
    
    // If key hasn't changed, proceed with normal update
    const updateRequest: UpdateVariableInEnvironmentRequest = {
      environmentId: this.currentEnvironment.id,
      key: variable.key.trim(),
      value: variable.value || ''
    };
    
    console.log('Sending update request:', updateRequest);
    
    // Show loading indicator
    const loadingRef = this.snackBar.open('Updating variable...', '', { duration: undefined });
    
    this.environmentService.updateVariableInEnvironment(updateRequest).subscribe({
      next: (response) => {
        loadingRef.dismiss();
        console.log('Update response:', response);
        
        if (response.isSuccess) {
          this.snackBar.open('Variable updated successfully', 'Close', { duration: 3000 });
          
          // Reload the environment to get the latest data
          this.reloadCurrentEnvironment();
          // Also refresh the environments list
          this.loadEnvironments();
        } else {
          console.error('Error updating variable:', response.error);
          
          // If direct update fails, try the bulk update approach as fallback
          this.updateEnvironmentWithAllVariables(index, variable.key.trim(), variable.value || '');
        }
      },
      error: (error) => {
        loadingRef.dismiss();
        console.error('Error updating variable:', error);
        
        // If direct update fails with error, try the bulk update approach as fallback
        this.updateEnvironmentWithAllVariables(index, variable.key.trim(), variable.value || '');
      }
    });
  }
  
  /**
   * Get the original key from the current environment variables object
   * @param index The index of the variable in the environmentVariables array
   * @returns The original key or null if not found
   */
  private getOriginalKeyFromCurrentEnvironment(index: number): string | null {
    if (!this.currentEnvironment?.variables || index < 0 || index >= this.environmentVariables.length) {
      return null;
    }
    
    // Find the original key in the environment variables object
    // We need to match by position since we're working with an array that was converted from an object
    const keys = Object.keys(this.currentEnvironment.variables);
    if (index < keys.length) {
      return keys[index];
    }
    
    return null;
  }
  
  /**
   * Handle a key change by removing the old variable and adding a new one
   * @param oldKey The original key to remove
   * @param newKey The new key to add
   * @param value The value for the new key
   */
  private handleKeyChange(oldKey: string, newKey: string, value: string): void {
    if (!this.currentEnvironment) return;
    
    const loadingRef = this.snackBar.open('Updating variable name...', '', { duration: undefined });
    
    // First remove the old key
    this.environmentService.removeVariableFromEnvironment({
      environmentId: this.currentEnvironment.id,
      key: oldKey
    }).subscribe({
      next: (removeResponse) => {
        if (removeResponse.isSuccess) {
          // Then add the new key with the value
          this.environmentService.addVariableToEnvironment({
            environmentId: this.currentEnvironment!.id,
            key: newKey,
            value: value
          }).subscribe({
            next: (addResponse) => {
              loadingRef.dismiss();
              if (addResponse.isSuccess) {
                this.snackBar.open('Variable name updated successfully', 'Close', { duration: 3000 });
                // Reload the environment to get the latest data
                this.reloadCurrentEnvironment();
                // Also refresh the environments list
                this.loadEnvironments();
              } else {
                console.error('Error adding new variable after key change:', addResponse.error);
                // Fall back to bulk update
                this.updateEnvironmentWithAllVariables(-1, newKey, value);
              }
            },
            error: (error) => {
              loadingRef.dismiss();
              console.error('Error adding new variable after key change:', error);
              // Fall back to bulk update
              this.updateEnvironmentWithAllVariables(-1, newKey, value);
            }
          });
        } else {
          loadingRef.dismiss();
          console.error('Error removing old variable during key change:', removeResponse.error);
          // Fall back to bulk update
          this.updateEnvironmentWithAllVariables(-1, newKey, value);
        }
      },
      error: (error) => {
        loadingRef.dismiss();
        console.error('Error removing old variable during key change:', error);
        // Fall back to bulk update
        this.updateEnvironmentWithAllVariables(-1, newKey, value);
      }
    });
  }
  
  /**
   * Update the entire environment with all variables
   * This is used as a fallback when individual variable update fails
   */
  private updateEnvironmentWithAllVariables(updatedIndex: number, updatedKey: string, updatedValue: string): void {
    if (!this.currentEnvironment) {
      console.error('Cannot update environment: currentEnvironment is null');
      this.snackBar.open('Error updating variable: Environment not loaded', 'Close', { duration: 3000 });
      return;
    }
    
    console.log('Falling back to bulk update for variable:', { updatedIndex, updatedKey, updatedValue });
    
    // Show loading indicator
    const loadingRef = this.snackBar.open('Updating environment...', '', { duration: undefined });
    
    // Convert the current variables to an object
    const variables: { [key: string]: string } = {};
    this.environmentVariables.forEach((v, i) => {
      if (i === updatedIndex) {
        // Use the updated key and value for the current variable
        variables[updatedKey] = updatedValue;
      } else {
        // Use the existing keys for other variables
        variables[v.key.trim()] = v.value || '';
      }
    });
    
    console.log('Bulk update variables:', variables);
    
    // Update the environment with all variables
    const request: UpdateEnvironmentRequest = {
      id: this.currentEnvironment.id,
      name: this.currentEnvironment.name || '',
      workspaceId: this.workspaceId,
      variables: variables
    };
    
    this.environmentService.updateEnvironment(request).subscribe({
      next: (response) => {
        loadingRef.dismiss();
        console.log('Bulk update response:', response);
        
        if (response.isSuccess) {
          this.snackBar.open('Variable updated successfully', 'Close', { duration: 3000 });
          
          // Reload the environment to get the latest data
          this.reloadCurrentEnvironment();
          // Also refresh the environments list
          this.loadEnvironments();
        } else {
          this.snackBar.open(`Error updating variable: ${response.error || 'Unknown error'}`, 'Close', { duration: 3000 });
          console.error('Error in bulk update:', response.error);
        }
      },
      error: (error) => {
        loadingRef.dismiss();
        this.snackBar.open('Error updating variable', 'Close', { duration: 3000 });
        console.error('Error in bulk update:', error);
      }
    });
  }
  
  /**
   * Save all environment variables to the environment
   * This is a bulk update operation that saves all variables at once
   */
  saveEnvironmentVariables(): void {
    if (!this.currentEnvironment) {
      return;
    }
    
    // Validate all variables for empty or duplicate keys
    const keys = new Set<string>();
    let hasEmptyKey = false;
    
    for (const variable of this.environmentVariables) {
      const trimmedKey = variable.key.trim();
      if (!trimmedKey) {
        hasEmptyKey = true;
        break;
      }
      
      if (keys.has(trimmedKey)) {
        this.snackBar.open('Duplicate variable keys found. Please fix before saving.', 'Close', { duration: 3000 });
        return;
      }
      
      keys.add(trimmedKey);
    }
    
    if (hasEmptyKey) {
      this.snackBar.open('Empty variable keys found. Please fix before saving.', 'Close', { duration: 3000 });
      return;
    }
    
    // Show loading indicator
    const loadingRef = this.snackBar.open('Saving environment variables...', '', { duration: undefined });
    
    // Convert the array of variables back to an object
    const variables: { [key: string]: string } = {};
    for (const variable of this.environmentVariables) {
      variables[variable.key.trim()] = variable.value || '';
    }
    
    // Update the environment with the new variables
    const request: UpdateEnvironmentRequest = {
      id: this.currentEnvironment?.id,
      name: this.currentEnvironment?.name || '',
      workspaceId: this.workspaceId,
      variables: variables
    };
    
    this.environmentService.updateEnvironment(request).subscribe({
      next: (response) => {
        loadingRef.dismiss();
        
        if (response.isSuccess) {
          this.snackBar.open('All environment variables saved successfully', 'Close', { duration: 3000 });
          this.closeEnvironmentVariablesModal();
          this.loadEnvironments(); // Refresh the environments list
        } else {
          this.snackBar.open(`Error saving environment variables: ${response.error || 'Unknown error'}`, 'Close', { duration: 3000 });
          console.error('Error saving environment variables:', response.error);
        }
      },
      error: (error) => {
        loadingRef.dismiss();
        this.snackBar.open('Error saving environment variables', 'Close', { duration: 3000 });
        console.error('Error saving environment variables:', error);
      }
    });
  }

  // Toggle item menu (for collection, folder, or request)
  toggleItemMenu(event: MouseEvent, itemType: 'collection' | 'folder' | 'request', itemId: number) {
    event.preventDefault();
    event.stopPropagation();

    // Get the button element that was clicked
    const button = (event.currentTarget || event.target) as HTMLElement;
    if (!button) return;

    // Get the button's position relative to the viewport
    const buttonRect = button.getBoundingClientRect();
    const sidebarContainer = document.querySelector('.sidebar-container');
    if (!sidebarContainer) return;

    const sidebarRect = sidebarContainer.getBoundingClientRect();

    // Calculate available space
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceRight = viewportWidth - buttonRect.left;

    // Menu dimensions
    const menuWidth = 220; // Width from CSS
    const menuHeight = 200; // Approximate height

    // Calculate optimal position
    let top = buttonRect.bottom;
    let left = Math.max(sidebarRect.left, buttonRect.left);

    // Adjust vertical position if needed
    if (spaceBelow < menuHeight) {
      top = Math.max(0, buttonRect.top - menuHeight);
    }

    // Adjust horizontal position if needed
    if (spaceRight < menuWidth) {
      left = Math.max(sidebarRect.left, buttonRect.right - menuWidth);
    }

    // Ensure menu stays within sidebar bounds
    left = Math.max(sidebarRect.left, Math.min(left, sidebarRect.right - menuWidth));

    // Update menu position
    this.itemMenuPosition = {
      top: `${top}px`,
      left: `${left}px`
    };

    // If the same item menu is already open, close it
    if (this.showItemMenu && this.activeItemType === itemType && this.activeItemId === itemId) {
      this.closeItemMenu();
      return;
    }

    // Close any other open menu
    this.closeCollectionsMenu();

    // Set active item and show menu
    this.activeItemType = itemType;
    this.activeItemId = itemId;
    this.showItemMenu = true;

    // Handle click outside
    // Remove any existing listener first
    document.removeEventListener('click', this.closeItemMenuOnClickOutside);

    // Add new listener with a slight delay to avoid immediate closure
    setTimeout(() => {
      document.addEventListener('click', this.closeItemMenuOnClickOutside);
    }, 100);
  }

  // Close the item menu
  closeItemMenu() {
    this.showItemMenu = false;
    this.activeItemType = null;
    this.activeItemId = null;
    document.removeEventListener('click', this.closeItemMenuOnClickOutside);
  }

  // Event handler to close item menu when clicking outside
  closeItemMenuOnClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const menuWrapper = target.closest('.item-menu-wrapper');
    const button = target.closest('button[mat-icon-button]');
    const isClickInsideMenu = menuWrapper !== null;
    const isClickOnButton = button !== null && button.contains(target);

    if (!isClickInsideMenu && !isClickOnButton) {
      this.closeItemMenu();
    }
  }

  // Event handler to close menu when clicking outside
  closeCollectionsMenuOnClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const menuWrapper = target.closest('.collections-menu-wrapper');
    const button = target.closest('button[mat-icon-button]');
    const isClickInsideMenu = menuWrapper !== null;
    const isClickOnButton = button !== null && button.contains(target);

    if (!isClickInsideMenu && !isClickOnButton) {
      this.closeCollectionsMenu();
    }
  }

  // Handle creating a new collection
  createNewCollection() {
    this.closeCollectionsMenu();
    this.showNewCollectionModal = true;
    this.newCollection = {
      name: '',
      description: ''
    };
  }

  // Create a new request in a collection or folder (as a draft/unsaved tab)  
  createNewRequest(parentType: 'collection' | 'folder', parentId: number) {
    this.closeItemMenu();
    console.log(`Create new draft request for ${parentType} with ID: ${parentId}`);

    // Check if this is a shared collection or folder
    let isShared = false;

    if (parentType === 'collection') {
      const collection = this.findCollectionById(parentId.toString());
      isShared = collection ? !!(collection as any).isShared : false;
    } else if (parentType === 'folder') {
      const collection = this.findCollectionByFolderId(parentId);
      isShared = collection ? !!(collection as any).isShared : false;
    }

    // Create a new tab with default values and target parent information
    // But don't set parentId since this indicates the request already exists
    const newTab = this.tabService.createNewTab({
      method: HttpMethod.GET,
      url: 'https://simple-books-api.glitch.me',
      name: `New ${parentType} Request`,
      // Instead of parentId, store target collection/folder information
      // in separate properties to indicate this is a draft that hasn't been saved yet
      targetType: parentType,    // Where to save the request when user clicks Save
      targetId: parentId,        // Collection or folder ID to save to
      isShared: isShared         // Indicate if this is in a shared collection
    });

    console.log(`Created new draft tab for ${parentType} ID: ${parentId}, isShared: ${isShared}`);

    // The request editor is already integrated in the workspace layout,
    // so we don't need to navigate to a different route
    
    // Request will only be saved when the user explicitly clicks Save
  }

  // Create a new folder in a collection
  createNewFolder(collectionId: number) {
    console.log('Creating new folder in collection:', collectionId);

    // Check if this is a shared collection
    const collection = this.findCollectionById(collectionId.toString());
    const isShared = collection ? !!(collection as any).isShared : false;

    // If it's a shared collection, check if the user has edit permission
    if (isShared) {
      // For now, we'll allow folder creation in shared collections
      // In a real implementation, you would check the user's permission level
      console.log('Creating folder in a shared collection');
    }

    this.currentCollectionId = collectionId;
    this.newFolder.name = ''; // Reset the form
    this.showNewFolderModal = true;
    this.closeItemMenu();
  }

  // Close the new folder modal
  closeNewFolderModal() {
    this.showNewFolderModal = false;
    this.currentCollectionId = null;
  }

  // Close the edit folder modal
  closeEditFolderModal() {
    this.showEditFolderModal = false;
    this.currentFolder = null;
  }

  // Close the delete folder modal
  closeDeleteFolderModal() {
    this.showDeleteFolderModal = false;
    this.currentFolder = null;
  }

  // Submit the edit folder form
  submitEditFolder() {
    if (!this.editFolder.name.trim() || !this.currentFolder) {
      return; // Don't submit if name is empty or no folder is selected
    }

    // Determine if this folder is in a shared collection
    const isShared = this.sharedCollections?.some(c => c.id === this.editFolder.collectionId) || false;

    // Prepare the update request
    const updateRequest = {
      id: this.editFolder.id,
      name: this.editFolder.name.trim(),
      collectionId: this.editFolder.collectionId
    };

    // Call the API to update the folder
    this.folderService.updateFolder(updateRequest).subscribe(
      response => {
        if (response.isSuccess) {
          // Update the folder in the UI
          if (this.currentFolder) {
            this.currentFolder.name = this.editFolder.name.trim();
          }

          // Close the modal and show success message
          this.closeEditFolderModal();
          this.snackBar.open('Folder updated successfully', 'Close', {
            duration: 3000
          });
        } else {
          // Show error message from the API
          this.snackBar.open(response.error || 'Failed to update folder', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.closeEditFolderModal();
        }
      },
      error => {
        // Handle HTTP error
        let errorMessage = 'Failed to update folder';

        // Check if this is a shared collection permission error
        if (isShared && error.status === 403) {
          errorMessage = 'You do not have permission to update folders in shared collections';
        } else if (error.error && error.error.error) {
          // Extract specific error message from the API response if available
          errorMessage = error.error.error;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.closeEditFolderModal();
      }
    );
  }

  // Confirm and delete the folder
  confirmDeleteFolder() {
    if (!this.currentFolder) {
      return; // Don't proceed if no folder is selected
    }

    // Determine if this folder is in a shared collection
    const isShared = this.sharedCollections?.some(c => c.id === this.currentFolder?.collectionId) || false;

    // Call the API to delete the folder
    this.folderService.deleteFolder(this.currentFolder.id).subscribe(
      response => {
        if (response.isSuccess) {
          // Remove the folder from the UI
          this.removeFolderFromUI(this.currentFolder!.id, this.currentFolder!.collectionId);
          this.closeDeleteFolderModal();

          // Show success message
          this.snackBar.open('Folder deleted successfully', 'Close', {
            duration: 3000
          });
        } else {
          // Show error message from the API
          this.snackBar.open(response.error || 'Failed to delete folder', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.closeDeleteFolderModal();
        }
      },
      error => {
        // Handle HTTP error
        let errorMessage = 'Failed to delete folder';

        // Check if this is a shared collection permission error
        if (isShared && error.status === 403) {
          errorMessage = 'You do not have permission to delete folders from shared collections';
        } else if (error.error && error.error.error) {
          // Extract specific error message from the API response if available
          errorMessage = error.error.error;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.closeDeleteFolderModal();
      }
    );
  }

  // Helper method to remove a folder from the UI after deletion
  private removeFolderFromUI(folderId: number, collectionId: number) {
    // Check all collections
    for (const collection of [...this.collections, ...(this.sharedCollections || [])]) {
      if (collection.id === collectionId && collection.folders) {
        collection.folders = collection.folders.filter(f => f.id !== folderId);
        return;
      }
    }
  }

  // Submit the new folder form
  submitNewFolder() {
    if (!this.newFolder.name.trim() || !this.currentCollectionId) {
      return; // Don't submit if name is empty or no collection is selected
    }

    // Determine if this is a shared collection
    const isShared = this.sharedCollections?.some(c => c.id === this.currentCollectionId) || false;

    // Prepare the folder creation request
    const folderRequest: CreateFolderRequest = {
      name: this.newFolder.name.trim(),
      collectionId: this.currentCollectionId
    };

    // Call the API to create the folder
    this.folderService.createFolder(folderRequest).subscribe(
      response => {
        if (response.isSuccess && response.data) {
          // Find the collection and add the new folder to it
          const collections = [...this.collections, ...(this.sharedCollections || [])];
          const collection = collections.find(c => c.id === this.currentCollectionId);

          if (collection) {
            if (!collection.folders) {
              collection.folders = [];
            }
            collection.folders.push(response.data);

            // Ensure the collection is expanded to show the new folder
            if (this.currentCollectionId) {
              this.expandedCollections.add(this.currentCollectionId);
            }
          }

          // Close the modal and show success message
          this.closeNewFolderModal();
          this.snackBar.open('Folder created successfully', 'Close', {
            duration: 3000
          });
        } else {
          // Show error message from the API
          this.snackBar.open(response.error || 'Failed to create folder', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.closeNewFolderModal();
        }
      },
      error => {
        // Handle HTTP error
        let errorMessage = 'Failed to create folder';

        // Check if this is a shared collection permission error
        if (isShared && error.status === 403) {
          errorMessage = 'You do not have permission to create folders in shared collections';
        } else if (error.error && error.error.error) {
          // Extract specific error message from the API response if available
          errorMessage = error.error.error;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.closeNewFolderModal();
      }
    );
  }

  // Edit an item (collection, folder, or request)
  editItem(itemType: 'collection' | 'folder' | 'request', itemId: number) {
    this.closeItemMenu();

    if (itemType === 'collection') {
      // Find the collection to edit
      const collection = this.findCollectionById(itemId.toString());
      if (collection) {
        this.currentCollection = collection;
        this.editCollection = {
          id: collection.id,
          name: collection.name,
          description: collection.description || ''
        };
        this.showEditCollectionModal = true;
      }
    } else if (itemType === 'folder') {
      // Find the folder to edit in owned collections
      let folderFound = false;
      for (const collection of this.collections) {
        if (collection.folders) {
          const folder = collection.folders.find(f => f.id === itemId);
          if (folder) {
            this.currentFolder = folder;
            this.editFolder = {
              id: folder.id,
              name: folder.name,
              collectionId: folder.collectionId
            };
            this.showEditFolderModal = true;
            folderFound = true;
            break;
          }
        }
      }

      // If folder not found in owned collections, check shared collections
      if (!folderFound && this.sharedCollections) {
        for (const collection of this.sharedCollections) {
          if (collection.folders) {
            const folder = collection.folders.find(f => f.id === itemId);
            if (folder) {
              this.currentFolder = folder;
              this.editFolder = {
                id: folder.id,
                name: folder.name,
                collectionId: folder.collectionId
              };
              this.showEditFolderModal = true;
              break;
            }
          }
        }
      }
    } else if (itemType === 'request') {
      console.log(`Edit request with ID: ${itemId}`);
      // TODO: Implement request edit functionality
    }
  }

  // Delete an item (collection, folder, or request)
  deleteItem(itemType: 'collection' | 'folder' | 'request', itemId: number) {
    this.closeItemMenu();

    if (itemType === 'collection') {
      // Find the collection to delete
      const collection = this.findCollectionById(itemId.toString());
      if (collection) {
        this.currentCollection = collection;
        this.showDeleteConfirmModal = true;
      }
    } else if (itemType === 'folder') {
      // Find the folder to delete in owned collections
      let folderFound = false;
      for (const collection of this.collections) {
        if (collection.folders) {
          const folder = collection.folders.find(f => f.id === itemId);
          if (folder) {
            this.currentFolder = folder;
            this.showDeleteFolderModal = true;
            folderFound = true;
            break;
          }
        }
      }

      // If folder not found in owned collections, check shared collections
      if (!folderFound && this.sharedCollections) {
        for (const collection of this.sharedCollections) {
          if (collection.folders) {
            const folder = collection.folders.find(f => f.id === itemId);
            if (folder) {
              this.currentFolder = folder;
              this.showDeleteFolderModal = true;
              break;
            }
          }
        }
      }
    } else if (itemType === 'request') {
      console.log(`Delete request with ID: ${itemId}`);
      // TODO: Implement request delete functionality
    }
  }

  importCollection(): void {
    this.showImportCollectionModal = true;
    this.importCollectionUrl = '';
    this.isImporting = false;
    this.importError = '';
  }

  closeImportCollectionModal(): void {
    this.showImportCollectionModal = false;
    this.importCollectionUrl = '';
    this.isImporting = false;
    this.importError = '';
  }

  /**
   * Set the active navigation item and load corresponding data
   */
  setActiveNavItem(item: NavItem): void {
    this.activeNavItem = item;
    
    // Load appropriate data based on the selected section
    if (item === 'collections') {
      this.loadCollections();
    } else if (item === 'environments') {
      this.loadEnvironments();
    } else if (item === 'history') {
      this.loadHistories();
    }
    
    // If we're on an environment route but switching to collections or history,
    // update the URL to remove the environment part
    if (item !== 'environments' && this.route.snapshot.params['environmentId']) {
      this.router.navigate(['/workspace', this.workspaceId], {
        replaceUrl: false,
        skipLocationChange: false
      });
    }
  }

  /**
   * Load histories for the current workspace
   */
  loadHistories(): void {
    if (!this.workspaceId) return;
    
    this.historyService.GetHistoryByWorkspaceId(this.workspaceId).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          // Sort histories in reverse chronological order (newest first)
          this.histories = response.data.sort((a: any, b: any) => {
            return new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime();
          });
          this.filterHistories(this.historySearchTerm);
        }
      },
      error: (error: any) => {
        console.error('Error loading histories:', error);
        this.snackBar.open('Failed to load request history', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Load environments for the current workspace
   */
  loadEnvironments(): void {
    // Use workspace ID from route to get workspace-specific environments
    if (!this.workspaceId) {
      // If no workspace ID is available yet, get it from the route
      const routeSub = this.route.params.subscribe(params => {
        const id = +params['id'];
        if (id) {
          this.workspaceId = id;
          this.fetchEnvironmentsByWorkspaceId(this.workspaceId);
        } else {
          console.error('No workspace ID available');
          this.snackBar.open('No workspace ID available', 'Close', { duration: 3000 });
        }
      });
      this.subscriptions.add(routeSub);
    } else {
      // If workspace ID is already available, use it directly
      this.fetchEnvironmentsByWorkspaceId(this.workspaceId);
    }
  }

  /**
   * Fetch environments by workspace ID
   * @param workspaceId The ID of the workspace to get environments for
   */
  private fetchEnvironmentsByWorkspaceId(workspaceId: number): void {
    console.log(`Fetching environments for workspace ID: ${workspaceId}`);
    this.environmentService.getEnvironmentsByWorkspaceId(workspaceId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.environments = response.data;
          this.filteredEnvironments = [...this.environments];
          console.log(`Loaded ${this.environments.length} environments for workspace ID ${workspaceId}:`, this.environments);
        } else {
          console.error(`Error loading environments for workspace ID ${workspaceId}:`, response.error);
          this.snackBar.open('Failed to load environments', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error(`Error loading environments for workspace ID ${workspaceId}:`, error);
        this.snackBar.open('Failed to load environments', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Filter environments based on search term
   * @param searchTerm The search term to filter environments by
   */
  filterEnvironments(searchTerm: string): void {
    this.environmentSearchTerm = searchTerm;
    if (!searchTerm) {
      // If search term is empty, show all environments
      this.filteredEnvironments = [...this.environments];
    } else {
      // Filter environments by name (case-insensitive)
      const term = searchTerm.toLowerCase();
      this.filteredEnvironments = this.environments.filter(env =>
        env.name.toLowerCase().includes(term)
      );
    }
    console.log(`Filtered environments by "${searchTerm}": ${this.filteredEnvironments.length} results`);
  }

  /**
   * Open the new environment modal
   */
  openNewEnvironmentModal(): void {
    this.newEnvironment = {
      name: '',
      workSpaceId: this.workspaceId
    };
    this.showNewEnvironmentModal = true;
  }

  /**
   * Close the new environment modal
   */
  closeNewEnvironmentModal(): void {
    this.showNewEnvironmentModal = false;
  }

  /**
   * Create a new environment
   */
  createNewEnvironment(): void {
    if (!this.newEnvironment.name.trim()) {
      this.snackBar.open('Environment name is required', 'Close', { duration: 3000 });
      return;
    }

    const request: CreateEnvironmentRequest = {
      name: this.newEnvironment.name.trim(),
      workSpaceId: this.workspaceId
    };

    this.environmentService.createEnvironment(request).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          console.log('Environment created successfully:', response.data);
          this.snackBar.open('Environment created successfully', 'Close', { duration: 3000 });
          this.closeNewEnvironmentModal();
          this.loadEnvironments(); // Refresh the environments list
        } else {
          console.error('Error creating environment:', response.error);
          this.snackBar.open(`Failed to create environment: ${response.error}`, 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error creating environment:', error);
        this.snackBar.open('Failed to create environment', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Open the edit environment modal
   * @param environment The environment to edit
   * @param event Mouse event to stop propagation
   */
  openEditEnvironmentModal(environment: Environment, event: MouseEvent): void {
    // Stop event propagation to prevent the navigateToEnvironment method from being called
    if (event) {
      event.stopPropagation();
    }
    
    this.currentEnvironment = { ...environment };
    this.showEditEnvironmentModal = true;
  }

  /**
   * Close the edit environment modal
   */
  closeEditEnvironmentModal(): void {
    this.showEditEnvironmentModal = false;
    this.currentEnvironment = null;
  }

  /**
   * Update an environment
   */
  updateEnvironment(): void {
    if (!this.currentEnvironment) {
      return;
    }

    if (!this.currentEnvironment.name.trim()) {
      this.snackBar.open('Environment name is required', 'Close', { duration: 3000 });
      return;
    }

    const request: UpdateEnvironmentRequest = {
      id: this.currentEnvironment.id,
      name: this.currentEnvironment.name.trim(),
      workspaceId: this.workspaceId,
      variables: this.currentEnvironment.variables || {}
    };

    this.environmentService.updateEnvironment(request).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          console.log('Environment updated successfully');
          this.snackBar.open('Environment updated successfully', 'Close', { duration: 3000 });
          this.closeEditEnvironmentModal();
          this.loadEnvironments(); // Refresh the environments list
        } else {
          console.error('Error updating environment:', response.error);
          this.snackBar.open(`Failed to update environment: ${response.error}`, 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error updating environment:', error);
        this.snackBar.open('Failed to update environment', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Open the delete environment confirmation modal
   * @param environment The environment to delete
   * @param event Mouse event to stop propagation
   */
  openDeleteEnvironmentModal(environment: Environment, event: MouseEvent): void {
    // Stop event propagation to prevent the navigateToEnvironment method from being called
    if (event) {
      event.stopPropagation();
    }
    
    this.currentEnvironment = environment;
    this.showDeleteEnvironmentModal = true;
  }

  /**
   * Close the delete environment modal
   */
  closeDeleteEnvironmentModal(): void {
    this.showDeleteEnvironmentModal = false;
    this.currentEnvironment = null;
  }

  /**
   * Delete an environment
   */
  deleteEnvironment(): void {
    if (!this.currentEnvironment) {
      return;
    }

    this.environmentService.deleteEnvironment(this.currentEnvironment.id, this.currentEnvironment.workSpaceId).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          console.log('Environment deleted successfully');
          this.snackBar.open('Environment deleted successfully', 'Close', { duration: 3000 });
          this.closeDeleteEnvironmentModal();
          this.loadEnvironments(); // Refresh the environments list
        } else {
          console.error('Error deleting environment:', response.error);
          this.snackBar.open(`Failed to delete environment: ${response.error}`, 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error deleting environment:', error);
        this.snackBar.open('Failed to delete environment', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Filter history items based on search term
   * @param searchTerm The search term to filter by
   */
  filterHistories(searchTerm: string): void {
    this.historySearchTerm = searchTerm;
    
    if (!searchTerm) {
      this.filteredHistories = [...this.histories];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredHistories = this.histories.filter(history => {
        const url = history.requests?.url?.toLowerCase() || '';
        const method = history.requests?.httpMethod?.toLowerCase() || '';
        return url.includes(term) || method.includes(term);
      });
    }
    
    // Group histories by date
    this.groupHistoriesByDate();
  }

  /**
   * Delete a history item
   * @param id The ID of the history item to delete
   * @param event The mouse event
   */
  deleteHistoryItem(id: number, event: MouseEvent): void {
    event.stopPropagation(); // Prevent triggering the parent click event
    
    this.historyService.DeleteHistory(id).subscribe({
      next: () => {
        // Remove the item from the local arrays
        this.histories = this.histories.filter(h => h.id !== id);
        this.filterHistories(this.historySearchTerm); // This will also update groupedHistories
        
        this.snackBar.open('History item deleted', 'Close', { duration: 2000 });
      },
      error: (error: any) => {
        console.error('Error deleting history item:', error);
        this.snackBar.open('Failed to delete history item', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Extract domain from URL for professional history display
   * @param url The full URL
   * @returns Domain part of the URL
   */
  getDomainFromUrl(url: string): string {
    if (!url) return 'No URL';

    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      // For invalid URLs, try to extract domain-like part
      const domainMatch = url.match(/^(?:https?:\/\/)?([^\/]+)/i);
      return domainMatch ? domainMatch[1] : url.substring(0, 30);
    }
  }

  /**
   * Extract path from URL for professional history display
   * @param url The full URL
   * @returns Path part of the URL
   */
  getPathFromUrl(url: string): string {
    if (!url) return '/path';

    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      // For invalid URLs, try to extract path-like part
      const pathMatch = url.match(/^(?:https?:\/\/)?[^\/]+(\/.+)/i);
      return pathMatch ? pathMatch[1] : '/path';
    }
  }


  // Toggle expand state of an item (collection or folder)
  toggleExpand(id: number, itemType: 'collection' | 'folder' = 'collection') {
    if (itemType === 'collection') {
      if (this.expandedCollections.has(id)) {
        this.expandedCollections.delete(id);

        // When a collection is collapsed, also collapse all its folders
        if (this.collections) {
          const collection = this.collections.find(c => c.id === id);
          if (collection && collection.folders) {
            collection.folders.forEach(folder => {
              this.expandedFolders.delete(folder.id);
            });
          }
        }
      } else {
        this.expandedCollections.add(id);
      }
    } else if (itemType === 'folder') {
      // For folders, toggle only the folder's expanded state
      // Find the parent collection to ensure it stays expanded
      let parentCollectionId: number | null = null;

      if (this.collections) {
        for (const collection of this.collections) {
          if (collection.folders && collection.folders.some(f => f.id === id)) {
            parentCollectionId = collection.id;
            break;
          }
        }
      }

      // Ensure the parent collection stays expanded
      if (parentCollectionId !== null) {
        this.expandedCollections.add(parentCollectionId);
      }

      // Toggle the folder's expanded state
      if (this.expandedFolders.has(id)) {
        this.expandedFolders.delete(id);
      } else {
        this.expandedFolders.add(id);
      }
    }

    // Update the combined expandedItems set for backward compatibility
    this.expandedItems = new Set([...this.expandedCollections, ...this.expandedFolders]);
  }

  isExpanded(id: number, itemType: 'collection' | 'folder' = 'collection'): boolean {
    if (itemType === 'collection') {
      return this.expandedCollections.has(id);
    } else if (itemType === 'folder') {
      return this.expandedFolders.has(id);
    }
    return this.expandedItems.has(id); // Fallback for backward compatibility
  }

  onDragStarted(item: any) {
    this.draggedItem = item;
  }

  onDragEnded() {
    this.draggedItem = null;
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same container
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between containers
      const item = event.item.data;

      // Check if we're moving a request or a folder
      const isFolder = item && typeof item === 'object' && 'requests' in item;

      if (isFolder) {
        // Moving a folder between collections
        const sourceContainerId = event.previousContainer.id;
        const targetContainerId = event.container.id;

        // Only handle moving between collections for now
        if (sourceContainerId.startsWith('collection-') && targetContainerId.startsWith('collection-')) {
          const sourceCollectionId = sourceContainerId.replace('collection-', '');
          const targetCollectionId = targetContainerId.replace('collection-', '');

          const sourceCollection = this.findCollectionById(sourceCollectionId);
          const targetCollection = this.findCollectionById(targetCollectionId);

          if (sourceCollection && targetCollection && sourceCollection !== targetCollection) {
            // Remove from source collection
            const sourceIndex = sourceCollection.folders.findIndex(f => f.id === item.id);
            if (sourceIndex > -1) {
              const [movedFolder] = sourceCollection.folders.splice(sourceIndex, 1);

              // Add to target collection
              const targetIndex = Math.min(event.currentIndex, targetCollection.folders.length);
              targetCollection.folders.splice(targetIndex, 0, movedFolder);

              // Ensure the target collection is expanded
              this.expandedItems.add(targetCollection.id);

              // Here you would typically call an API to update the folder's parent collection
              console.log(`Moved folder ${movedFolder.name} from collection ${sourceCollection.name} to ${targetCollection.name}`);
            }
          }
        }
      } else {
        // Moving a request between containers
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );

        // Here you would typically call an API to update the request's parent
        console.log('Moved request between containers');
      }
    }
  }

  findCollectionByFolderId(folderId: number): Collection | undefined {
    // Find the collection that contains the folder with the given ID

    // First check owned collections
    const ownedCollection = this.collections.find(collection =>
      collection.folders && collection.folders.some(folder => folder.id === folderId)
    );
    if (ownedCollection) {
      return ownedCollection;
    }

    // If not found, check shared collections
    if (this.sharedCollections) {
      const sharedCollection = this.sharedCollections.find(collection =>
        collection.folders && collection.folders.some(folder => folder.id === folderId)
      );
      if (sharedCollection) {
        return sharedCollection;
      }
    }

    return undefined;
  }

  // Find a request by its ID and show the delete confirmation modal
  findRequestById(requestId: number) {
    // Search in direct collection requests
    for (const collection of [...this.collections, ...(this.sharedCollections || [])]) {
      // Check requests directly in the collection
      if (collection.requests) {
        const request = collection.requests.find(r => r.id === requestId);
        if (request) {
          this.currentRequest = { ...request, isShared: collection.isShared };
          this.showDeleteRequestModal = true;
          return;
        }
      }

      // Check requests in folders
      if (collection.folders) {
        for (const folder of collection.folders) {
          if (folder.requests) {
            const request = folder.requests.find(r => r.id === requestId);
            if (request) {
              this.currentRequest = { ...request, isShared: collection.isShared };
              this.showDeleteRequestModal = true;
              return;
            }
          }
        }
      }
    }

    console.error(`Request with ID ${requestId} not found`);
  }

  // Close the delete request modal
  closeDeleteRequestModal() {
    this.showDeleteRequestModal = false;
    this.currentRequest = null;
  }

  // Confirm and execute the request deletion
  confirmDeleteRequest() {
    if (!this.currentRequest || !this.currentRequest.id) return;

    const requestId = this.currentRequest.id;
    const isShared = this.currentRequest.isShared;

    this.requestService.deleteRequest(requestId).subscribe(
      response => {
        if (response.isSuccess) {
          // Remove the request from the UI
          this.removeRequestFromUI(requestId);
          this.closeDeleteRequestModal();

          // Show success message
          this.snackBar.open('Request deleted successfully', 'Close', {
            duration: 3000
          });
        } else {
          // Show error message from the API
          this.snackBar.open(response.error || 'Failed to delete request', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.closeDeleteRequestModal();
        }
      },
      error => {
        // Handle HTTP error
        let errorMessage = 'Failed to delete request';

        // Check if this is a shared collection permission error
        if (isShared && error.status === 403) {
          errorMessage = 'You do not have permission to delete requests from shared collections';
        } else if (error.error && error.error.error) {
          // Extract specific error message from the API response if available
          errorMessage = error.error.error;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.closeDeleteRequestModal();
      }
    );
  }

  // Remove the deleted request from the UI
  private removeRequestFromUI(requestId: number) {
    // Remove from collections
    for (const collection of [...this.collections, ...(this.sharedCollections || [])]) {
      // Remove from direct collection requests
      if (collection.requests) {
        collection.requests = collection.requests.filter(r => r.id !== requestId);
      }

      // Remove from folder requests
      if (collection.folders) {
        for (const folder of collection.folders) {
          if (folder.requests) {
            folder.requests = folder.requests.filter(r => r.id !== requestId);
          }
        }
      }
    }
  }

  // This section intentionally left empty as the duplicate functions were removed
  // The enhanced versions of confirmDeleteRequest and removeRequestFromUI with proper error handling
  // for shared collections are kept above

  findCollectionById(collectionId: string): Collection | undefined {
    // Convert collection.id (number) to string for comparison

    // First check owned collections
    const ownedCollection = this.collections.find(collection => collection.id.toString() === collectionId);
    if (ownedCollection) {
      return ownedCollection;
    }

    // If not found, check shared collections
    if (this.sharedCollections) {
      const sharedCollection = this.sharedCollections.find(collection => collection.id.toString() === collectionId);
      if (sharedCollection) {
        return sharedCollection;
      }
    }

    return undefined;
  }


  getConnectedLists(): string[] {
    return this.collections.map(c => `collection-${c.id}`);
  }

  getFolderConnectedLists(folder: Folder): string[] {
    // Since the Folder model doesn't have nested folders in the API,
    // we'll just return the collection IDs
    return this.collections.map(c => `collection-${c.id}`);
  }

  // Close the new collection modal
  closeNewCollectionModal() {
    this.showNewCollectionModal = false;
  }

  // Close the edit collection modal
  closeEditCollectionModal() {
    this.showEditCollectionModal = false;
    this.currentCollection = null;
  }

  // Close the delete confirmation modal
  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
    this.currentCollection = null;
  }

  // Submit the new collection form
  submitNewCollection() {
    if (!this.newCollection.name.trim()) {
      return; // Don't submit if name is empty
    }

    // Prepare the collection request
    this.collectionForm = {
      name: this.newCollection.name.trim(),
      description: this.newCollection.description.trim(),
      workSpaceId: this.workspaceId
    };

    // Call the API to create the collection
    this.collectionService.createCollection(this.collectionForm).subscribe({
      next: (response: ApiResponse<Collection>) => {
        if (response.isSuccess) {
          console.log('Collection created successfully:', response.data);
          // Reload collections to get the updated list
          this.loadCollections();
        } else {
          console.error('Failed to create collection:', response.error);
        }
      },
      error: (error) => {
        console.error('Error creating collection:', error);
      }
    });

    // Close the modal
    this.closeNewCollectionModal();
  }

  // Submit the edit collection form
  submitEditCollection() {
    if (!this.editCollection.name.trim() || !this.currentCollection) {
      return; // Don't submit if name is empty or no collection is selected
    }

    // Determine if this is a shared collection
    const isShared = this.currentCollection.isShared || false;

    // Prepare the update request
    const updateRequest = {
      id: this.editCollection.id,
      name: this.editCollection.name.trim(),
      description: this.editCollection.description.trim(),
      workSpaceId: this.workspaceId
    };

    // Call the API to update the collection
    this.collectionService.updateCollection(updateRequest).subscribe(
      response => {
        if (response.isSuccess) {
          // Reload collections to get the updated list
          this.loadCollections();
          this.closeEditCollectionModal();

          // Show success message
          this.snackBar.open('Collection updated successfully', 'Close', {
            duration: 3000
          });
        } else {
          // Show error message from the API
          this.snackBar.open(response.error || 'Failed to update collection', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.closeEditCollectionModal();
        }
      },
      error => {
        // Handle HTTP error
        let errorMessage = 'Failed to update collection';

        // Check if this is a shared collection permission error
        if (isShared && error.status === 403) {
          errorMessage = 'You do not have permission to update this shared collection';
        } else if (error.error && error.error.error) {
          // Extract specific error message from the API response if available
          errorMessage = error.error.error;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.closeEditCollectionModal();
      }
    );
  }

  // Confirm and delete the collection
  confirmDeleteCollection() {
    if (!this.currentCollection) {
      return; // Don't proceed if no collection is selected
    }

    // Determine if this is a shared collection
    const isShared = this.currentCollection.isShared || false;

    // Call the API to delete the collection
    this.collectionService.deleteCollection(this.currentCollection.id).subscribe(
      response => {
        if (response.isSuccess) {
          // Reload collections to get the updated list
          this.loadCollections();
          this.closeDeleteConfirmModal();

          // Show success message
          this.snackBar.open('Collection deleted successfully', 'Close', {
            duration: 3000
          });
        } else {
          // Show error message from the API
          this.snackBar.open(response.error || 'Failed to delete collection', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.closeDeleteConfirmModal();
        }
      },
      error => {
        // Handle HTTP error
        let errorMessage = 'Failed to delete collection';

        // Check if this is a shared collection permission error
        if (isShared && error.status === 403) {
          errorMessage = 'You do not have permission to delete this shared collection';
        } else if (error.error && error.error.error) {
          // Extract specific error message from the API response if available
          errorMessage = error.error.error;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.closeDeleteConfirmModal();
      }
    );
  }


  loadCollections() {
    console.log('Loading collections for workspace:', this.workspaceId);

    // Load both owned collections and shared collections
    forkJoin({
      owned: this.collectionService.getCollectionsByWorkspaceId(this.workspaceId),
      shared: this.collectionService.getSharedCollections()
    }).subscribe({
      next: (results) => {
        // Process owned collections
        if (results.owned.isSuccess && results.owned.data) {
          console.log('Owned collections loaded:', results.owned.data);
          this.collections = results.owned.data;
          this.filteredCollections = [...this.collections]; // Initialize filtered collections

          // Initialize folders array if it doesn't exist
          this.collections.forEach(collection => {
            if (!collection.folders) {
              collection.folders = [];
            }
            if (!collection.requests) {
              collection.requests = [];
            }
          });
        } else {
          console.error('Failed to load owned collections:', results.owned.error);
          this.collections = [];
          this.filteredCollections = [];
        }

        // Process shared collections
        if (results.shared.isSuccess && results.shared.data) {
          console.log('Shared collections loaded:', results.shared.data);
          this.sharedCollections = results.shared.data;
          this.filteredSharedCollections = [...this.sharedCollections]; // Initialize filtered shared collections

          // Initialize folders array if it doesn't exist
          this.sharedCollections.forEach(collection => {
            if (!collection.folders) {
              collection.folders = [];
            }
            if (!collection.requests) {
              collection.requests = [];
            }

            // Mark as shared for UI display
            collection.isShared = true;
          });
        } else {
          console.error('Failed to load shared collections:', results.shared.error);
          this.sharedCollections = [];
          this.filteredSharedCollections = [];
        }

        // Apply any existing search filter
        if (this.searchTerm) {
          this.filterCollections(this.searchTerm);
        }
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.collections = [];
        this.sharedCollections = [];
        this.filteredCollections = [];
        this.filteredSharedCollections = [];
      }
    });
  }

  // Handle collection import submission
  submitImportCollection() {
    // Check if URL is provided
    if (this.importCollectionUrl && this.importCollectionUrl.trim() !== '') {
      this.importCollectionFromUrl();
      return;
    }

    // Otherwise proceed with file import
    const fileInput = this.fileInputRef?.nativeElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      console.error('No file selected');
      this.importError = 'Please select a file to import';
      return;
    }

    const file = fileInput.files[0];

    // Check if the file is a JSON file
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      console.error('Invalid file type. Please select a JSON file.');
      this.importError = 'Invalid file type. Please select a JSON file';
      return;
    }

    // Show loading state
    this.isImporting = true;
    this.importError = '';

    // Import the collection using the service
    this.collectionImportService.importFromFile(file, this.workspaceId)
      .subscribe({
        next: (collection) => {
          console.log('Collection imported successfully:', collection);
          this.closeImportCollectionModal();
          // Refresh collections list
          this.loadCollections();
        },
        error: (error) => {
          console.error('Error importing collection:', error);
          this.importError = error.message || 'Failed to import collection';
          this.isImporting = false;
        },
        complete: () => {
          this.isImporting = false;
        }
      });
  }

  // Import collection from URL
  importCollectionFromUrl() {
    if (!this.importCollectionUrl || this.importCollectionUrl.trim() === '') {
      console.error('No URL provided');
      this.importError = 'Please enter a valid URL';
      return;
    }

    // Show loading state
    this.isImporting = true;
    this.importError = '';

    // Import the collection using the service
    this.collectionImportService.importFromUrl(this.importCollectionUrl, this.workspaceId)
      .subscribe({
        next: (collection) => {
          console.log('Collection imported successfully:', collection);
          this.closeImportCollectionModal();
          // Refresh collections list
          this.loadCollections();
        },
        error: (error) => {
          console.error('Error importing collection from URL:', error);
          this.importError = error.message || 'Failed to import collection from URL';
          this.isImporting = false;
        },
        complete: () => {
          this.isImporting = false;
        }
      });
  }

  // ngOnDestroy method is implemented at the end of the class

  /**
   * Advanced search functionality to filter collections, folders, and requests
   * @param searchTerm - The search term to filter items by
   */
  filterCollections(searchTerm: string) {
    this.searchTerm = searchTerm.toLowerCase().trim();

    if (!this.searchTerm) {
      // If search term is empty, show all collections
      this.filteredCollections = [...this.collections];
      this.filteredSharedCollections = [...this.sharedCollections];
      return;
    }

    // Auto-expand collections with matching items for better UX
    const matchingCollectionIds = new Set<number>();
    const matchingFolderIds = new Set<number>();

    // Filter owned collections with matching name, description, folders, or requests
    this.filteredCollections = this.collections.filter(collection => {
      // Check if collection matches
      const collectionNameMatch = collection.name.toLowerCase().includes(this.searchTerm);
      const collectionDescMatch = collection.description?.toLowerCase().includes(this.searchTerm);

      // Check if any folder in the collection matches
      const hasFolderMatch = collection.folders?.some(folder => {
        const folderMatch = folder.name.toLowerCase().includes(this.searchTerm);
        if (folderMatch) {
          // Auto-expand parent collection and folder when there's a match
          matchingCollectionIds.add(collection.id);
          matchingFolderIds.add(folder.id);
        }
        return folderMatch;
      });

      // Check if any request in the collection matches
      const hasRequestMatch = collection.requests?.some(request => {
        const requestMatch = request.name.toLowerCase().includes(this.searchTerm) ||
                            request.url?.toLowerCase().includes(this.searchTerm);
        if (requestMatch) {
          // Auto-expand parent collection when there's a match
          matchingCollectionIds.add(collection.id);
        }
        return requestMatch;
      });

      // Check if any request in any folder matches
      const hasFolderRequestMatch = collection.folders?.some(folder =>
        folder.requests?.some(request => {
          const requestMatch = request.name.toLowerCase().includes(this.searchTerm) ||
                              request.url?.toLowerCase().includes(this.searchTerm);
          if (requestMatch) {
            // Auto-expand parent collection and folder when there's a match
            matchingCollectionIds.add(collection.id);
            matchingFolderIds.add(folder.id);
          }
          return requestMatch;
        })
      );

      // If this collection or any of its contents match, return true
      const matches = collectionNameMatch || collectionDescMatch || hasFolderMatch || hasRequestMatch || hasFolderRequestMatch;
      if (matches) {
        matchingCollectionIds.add(collection.id);
      }
      return matches;
    });

    // Filter shared collections with matching name, description, folders, or requests
    this.filteredSharedCollections = this.sharedCollections.filter(collection => {
      // Check if collection matches
      const collectionNameMatch = collection.name.toLowerCase().includes(this.searchTerm);
      const collectionDescMatch = collection.description?.toLowerCase().includes(this.searchTerm);

      // Check if any folder in the collection matches
      const hasFolderMatch = collection.folders?.some(folder => {
        const folderMatch = folder.name.toLowerCase().includes(this.searchTerm);
        if (folderMatch) {
          // Auto-expand parent collection and folder when there's a match
          matchingCollectionIds.add(collection.id);
          matchingFolderIds.add(folder.id);
        }
        return folderMatch;
      });

      // Check if any request in the collection matches
      const hasRequestMatch = collection.requests?.some(request => {
        const requestMatch = request.name.toLowerCase().includes(this.searchTerm) ||
                            request.url?.toLowerCase().includes(this.searchTerm);
        if (requestMatch) {
          // Auto-expand parent collection when there's a match
          matchingCollectionIds.add(collection.id);
        }
        return requestMatch;
      });

      // Check if any request in any folder matches
      const hasFolderRequestMatch = collection.folders?.some(folder =>
        folder.requests?.some(request => {
          const requestMatch = request.name.toLowerCase().includes(this.searchTerm) ||
                              request.url?.toLowerCase().includes(this.searchTerm);
          if (requestMatch) {
            // Auto-expand parent collection and folder when there's a match
            matchingCollectionIds.add(collection.id);
            matchingFolderIds.add(folder.id);
          }
          return requestMatch;
        })
      );

      // If this collection or any of its contents match, return true
      const matches = collectionNameMatch || collectionDescMatch || hasFolderMatch || hasRequestMatch || hasFolderRequestMatch;
      if (matches) {
        matchingCollectionIds.add(collection.id);
      }
      return matches;
    });

    // Auto-expand matching collections and folders for better UX
    matchingCollectionIds.forEach(id => this.expandedCollections.add(id));
    matchingFolderIds.forEach(id => this.expandedFolders.add(id));
  }

  /**
   * Implement OnDestroy interface to clean up subscriptions
   */
  /**
   * Opens a request in a new tab or switches to an existing tab if it's already open
   * @param request The request to open in a tab
   */
  openRequestInTab(request: Request): void {
    if (!request || !request.id) {
      this.snackBar.open('Invalid request data', 'Close', { duration: 3000 });
      return;
    }

    // Determine the parent type based on the request's folder or collection ID
    const parentType = request.folderId ? 'folder' : 'collection';

    // Check if a tab with this request already exists
    const existingTabForRequest = this.tabService.tabs.find(tab => 
      tab.parentId === request.id && 
      (tab.parentType === 'collection' || tab.parentType === 'folder')
    );

    if (existingTabForRequest) {
      // If a tab already exists for this request, switch to it
      this.tabService.activateTab(existingTabForRequest.id);
    } else {
      // Otherwise, fetch the request details and create a new tab
      this.requestService.getRequest(request.id).subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            const requestData = response.data;

            // Convert header object to KeyValuePair array with all data preserved
            const headers: KeyValuePair[] = this.objectToKeyValuePairs(requestData.headers);
            
            // Convert parameters object to KeyValuePair array if it exists
            const params: KeyValuePair[] = requestData.parameters 
              ? this.objectToKeyValuePairs(requestData.parameters)
              : [{ key: '', value: '', enabled: true }];
              
            // Ensure we have at least one empty row for user input if no data exists
            if (headers.length === 0) {
              headers.push({ key: '', value: '', enabled: true });
            }
            
            if (params.length === 0) {
              params.push({ key: '', value: '', enabled: true });
            }
            
            // Determine authentication information
            const authType = requestData.authentication?.authType || AuthType.NONE;
            const authData = requestData.authentication?.authData || {};
                        
            // Create new tab with the request data
            const newTab = this.tabService.createNewTab({
              name: requestData.name,
              url: requestData.url || '',
              method: requestData.httpMethod,
              params: params,
              headers: headers,
              body: typeof requestData.body === 'string' ? requestData.body : JSON.stringify(requestData.body, null, 2) || '',
              bodyType: 'json', // Default to JSON, app can detect proper type based on content
              authType: authType,
              basicAuthUsername: authData['username'] || '',
              basicAuthPassword: authData['password'] || '',
              bearerToken: authData['token'] || '',
              parentId: requestData.id,
              parentType: parentType
            });

            // Notify user
            this.snackBar.open(`Request "${requestData.name}" opened in a new tab`, 'Close', { duration: 3000 });
          } else {
            this.snackBar.open('Failed to load request details', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error loading request details:', error);
          this.snackBar.open('Error loading request details', 'Close', { duration: 3000 });
        }
      });
    }
  }

  /**
   * Convert an object of key-value pairs to KeyValuePair array
   * @param obj The object to convert
   */
  private objectToKeyValuePairs(obj?: any): KeyValuePair[] {
    if (!obj) return [{ key: '', value: '', enabled: true }];
    
    // Handle the case where obj is already an array of key-value pairs
    if (Array.isArray(obj)) {
      return obj.map(item => ({
        key: item.key || '',
        value: String(item.value || ''),
        description: item.description ? String(item.description) : undefined,
        enabled: Boolean(item.enabled !== undefined ? item.enabled : true)
      }));
    }
    
    // Handle case where obj is a simple key-value object
    if (typeof obj === 'object') {
      return Object.entries(obj).map(([key, val]) => {
        // Check if value is an object with metadata
        if (val && typeof val === 'object' && val.hasOwnProperty('value')) {
          const valueObj = val as Record<string, any>;
          return {
            key,
            value: String(valueObj['value'] || ''),
            description: valueObj['description'] ? String(valueObj['description']) : undefined,
            enabled: Boolean(valueObj.hasOwnProperty('enabled') ? valueObj['enabled'] : true)
          };
        }
        
        // Simple key-value pair
        return {
          key,
          value: String(val || ''),
          enabled: true
        };
      });
    }
    
    // Handle any other case by returning a default empty row
    return [{ key: '', value: '', enabled: true }];
  }

  /**
   * Group history items by date
   */
  groupHistoriesByDate(): void {
    this.groupedHistories = {};
    
    if (!this.filteredHistories.length) return;
    
    this.filteredHistories.forEach(history => {
      const date = new Date(history.timeStamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
      
      if (!this.groupedHistories[dateKey]) {
        this.groupedHistories[dateKey] = [];
      }
      
      this.groupedHistories[dateKey].push(history);
    });
    
    // Sort items within each date group in reverse chronological order (newest first)
    for (const dateKey in this.groupedHistories) {
      if (this.groupedHistories.hasOwnProperty(dateKey)) {
        this.groupedHistories[dateKey].sort((a: any, b: any) => {
          return new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime();
        });
      }
    }
  }
  
  /**
   * Extract domain from URL
   * @param url The URL to extract domain from
   */
  getUrlDomain(url: string): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Extract path from URL
   * @param url The URL to extract path from
   */
  getUrlPath(url: string): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      return url; // Return the original string if it's not a valid URL
    }
  }
  
  /**
   * Get CSS class based on HTTP status code
   * @param status The HTTP status code
   */
  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) {
      return 'status-success';
    } else if (status >= 300 && status < 400) {
      return 'status-redirect';
    } else if (status >= 400 && status < 500) {
      return 'status-client-error';
    } else if (status >= 500) {
      return 'status-server-error';
    } else {
      return '';
    }
  }
  
  /**
   * Load a history request into a new tab
   * @param history The history item to load
   */
  loadHistoryRequest(history: any): void {
    if (!history || !history.requests) {
      this.snackBar.open('Invalid history item', 'Close', { duration: 3000 });
      return;
    }
    
    const requestData = history.requests;
    
    // Extract headers from the request
    const headers = requestData.headers ? this.objectToKeyValuePairs(requestData.headers) : [];
    
    // Extract parameters from the request
    const params = requestData.parameters ? this.objectToKeyValuePairs(requestData.parameters) : [];
    
    // Extract authentication data
    const authType = requestData.authentication?.type || AuthType.NONE;
    const authData = requestData.authentication?.data || {};
    
    // Check if there's a cached script in localStorage first
    const cachedScript = localStorage.getItem(`apilot_script_${history.id}`);
    
    if (cachedScript) {
      // If we have a cached script, create the tab immediately with the script
      this.createTabWithRequestData(requestData, headers, params, authType, authData, history.id, cachedScript);
    } else {
      // Try to fetch the script from the backend
      this.requestService.getScriptByRequestId(history.id)
        .subscribe({
          next: (response) => {
            // Create the tab with the script if available
            const script = response.isSuccess && response.data ? response.data.Script : '';
            
            // Cache the script in localStorage for future use
            if (script) {
              localStorage.setItem(`apilot_script_${history.id}`, script);
            }
            
            this.createTabWithRequestData(requestData, headers, params, authType, authData, history.id, script);
          },
          error: (error) => {
            console.error('Error fetching script for request:', error);
            // If there's an error, create the tab without the script
            this.createTabWithRequestData(requestData, headers, params, authType, authData, history.id);
          }
        });
    }
  }

  /**
   * Generate a name for a request based on its URL
   * @param url The URL to generate a name from
   * @returns A name generated from the URL
   */
  private generateNameFromUrl(url: string): string {
    if (!url) return 'New Request';
    
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Get the last segment of the path
      const segments = path.split('/');
      const lastSegment = segments[segments.length - 1] || segments[segments.length - 2] || '';
      
      // If we have a meaningful path segment, use it
      if (lastSegment) {
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      }
      
      // Otherwise use the hostname
      return urlObj.hostname;
    } catch (e) {
      // If URL parsing fails, return a generic name
      return 'New Request';
    }
  }
  
  /**
   * Helper method to create a new tab with request data
   */
  private createTabWithRequestData(requestData: any, headers: any[], params: any[], authType: AuthType, authData: any, historyId: number, script?: string): void {
    // Create a new tab with the request data
    this.tabService.createNewTab({
      name: requestData.name || this.generateNameFromUrl(requestData.url),
      url: requestData.url || '',
      method: requestData.httpMethod || HttpMethod.GET,
      headers: headers,
      params: params,
      body: requestData.body || '',
      bodyType: 'json', // Default to JSON, app can detect proper type based on content
      authType: authType,
      basicAuthUsername: authData['username'] || '',
      basicAuthPassword: authData['password'] || '',
      bearerToken: authData['token'] || '',
      parentId: historyId,
      parentType: 'collection', // Using 'collection' as the parentType since 'history' is not an allowed value
      script: script || ''
    });
    
    // Notify user
    this.snackBar.open(`Request loaded from history`, 'Close', { duration: 2000 });
  }
  
  /**
   * Confirm clearing all history items
   * @param event The mouse event
   */
  confirmClearHistory(event: MouseEvent): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to clear all history items? This action cannot be undone.')) {
      this.clearAllHistory();
    }
  }
  
  /**
   * Clear all history items for the current workspace
   */
  clearAllHistory(): void {
    if (!this.workspaceId) return;
    
    this.historyService.ClearHistories(this.workspaceId).subscribe({
      next: () => {
        this.histories = [];
        this.filteredHistories = [];
        this.groupedHistories = {};
        
        this.snackBar.open('All history items cleared', 'Close', { duration: 2000 });
      },
      error: (error: any) => {
        console.error('Error clearing history:', error);
        this.snackBar.open('Failed to clear history', 'Close', { duration: 3000 });
      }
    });
  }
  

  

  
  /**
   * Gets the first three keys from an environment variables object
   * @param variables The environment variables object
   * @returns Array of up to three variable keys
   */
  getFirstThreeKeys(variables: any): string[] {
    if (!variables) return [];
    return Object.keys(variables).slice(0, 3);
  }
  
  /**
   * Masks a variable value for display in the UI
   * @param value The variable value to mask
   * @returns Masked value (shows first few characters and replaces rest with dots)
   */
  maskValue(value: string): string {
    if (!value) return '';
    if (value.length <= 4) return '****';
    return value.substring(0, 4) + '****';
  }
  
  /**
   * Gets a theme index for an environment card based on its ID
   * @param id The environment ID
   * @returns A theme index from 0-4
   */
  getThemeIndex(id: number): number {
    return id % 5; // 5 different themes (0-4)
  }
  
  /**
   * Formats a date for display in the UI
   * @param dateString The date string to format
   * @returns Formatted date string
   */
  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  /**
   * Gets the total count of variables across all environments
   * @returns Total variable count
   */
  getTotalVariablesCount(): number {
    if (!this.environments || this.environments.length === 0) return 0;
    return this.environments.reduce((total, env) => {
      return total + (env.variables ? Object.keys(env.variables).length : 0);
    }, 0);
  }
  
  /**
   * Sorts environments by the specified field and direction
   * @param field Field to sort by (name, variables, updated)
   * @param direction Sort direction (asc, desc)
   */
  sortEnvironments(field: string, direction: 'asc' | 'desc'): void {
    if (!this.environments || this.environments.length === 0) return;
    
    const sortedEnvs = [...this.environments];
    
    switch (field) {
      case 'name':
        sortedEnvs.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return direction === 'asc' ? comparison : -comparison;
        });
        break;
      case 'variables':
        sortedEnvs.sort((a, b) => {
          const aCount = a.variables ? Object.keys(a.variables).length : 0;
          const bCount = b.variables ? Object.keys(b.variables).length : 0;
          return direction === 'asc' ? aCount - bCount : bCount - aCount;
        });
        break;
      case 'updated':
        sortedEnvs.sort((a, b) => {
          const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
          const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
          return direction === 'asc' ? aDate - bDate : bDate - aDate;
        });
        break;
    }
    
    this.environments = sortedEnvs;
    this.filterEnvironments(this.environmentSearchTerm);
    
    this.snackBar.open(`Environments sorted by ${field} (${direction === 'asc' ? 'ascending' : 'descending'})`, 'Close', { duration: 2000 });
  }
  
  /**
   * Clones an existing environment
   * @param environment Environment to clone
   * @param event Mouse event
   */
  cloneEnvironment(environment: Environment, event: MouseEvent): void {
    event.stopPropagation();
    
    const clonedEnv: Partial<Environment> = {
      name: `${environment.name} (Copy)`,
      workSpaceId: environment.workSpaceId,
      variables: {...environment.variables}
    };
    
    // In a real implementation, you would call the API to create the cloned environment
    console.log('Cloning environment:', environment.id, clonedEnv);
    this.snackBar.open('Environment cloned successfully', 'Close', { duration: 2000 });
  }
  
  /**
   * Exports an environment to a JSON file
   * @param environment Environment to export
   * @param event Mouse event
   */
  exportEnvironment(environment: Environment, event: MouseEvent): void {
    event.stopPropagation();
    
    const exportData = {
      name: environment.name,
      variables: environment.variables,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Current User' // In a real app, use the actual username
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `${environment.name.replace(/\s+/g, '_')}_environment.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    this.snackBar.open(`Environment "${environment.name}" exported successfully`, 'Close', { duration: 2000 });
  }
  
  /**
   * Exports all environments to a JSON file
   */
  exportAllEnvironments(): void {
    if (!this.environments || this.environments.length === 0) return;
    
    const exportData = {
      environments: this.environments.map(env => ({
        name: env.name,
        variables: env.variables,
        id: env.id
      })),
      exportedAt: new Date().toISOString(),
      exportedBy: 'Current User', // In a real app, use the actual username
      workspaceId: this.workspaceId
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `workspace_${this.workspaceId}_environments.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    this.snackBar.open(`All environments exported successfully`, 'Close', { duration: 2000 });
  }
  
  /**
   * Opens modal to add a variable to an environment
   * @param environmentId Environment ID
   * @param event Mouse event
   */
  openAddVariableModal(environmentId: number, event: MouseEvent): void {
    event.stopPropagation();
    
    // Find the environment
    const environment = this.environments.find(env => env.id === environmentId);
    if (!environment) return;
    
    this.currentEnvironment = environment;
    this.newVariable = { key: '', value: '' };
    
    console.log('Opening add variable modal for environment:', environmentId);
    // In a real implementation, you would open a modal dialog here
    this.snackBar.open('Add variable functionality coming soon', 'Close', { duration: 2000 });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
      console.log('Sidebar component destroyed, all subscriptions cleaned up');
    }
  }
}
