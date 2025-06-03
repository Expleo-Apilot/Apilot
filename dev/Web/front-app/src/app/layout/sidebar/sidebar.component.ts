// src/app/layout/sidebar/sidebar.component.ts
import {Component, OnInit, OnDestroy} from '@angular/core';

// Define a type for the navigation items
type NavItem = 'collections' | 'environments' | 'flows' | 'history';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {ActivatedRoute, Router} from '@angular/router';
import {CollectionService} from '../../core/services/collection.service';
import {FolderService} from '../../core/services/folder.service';
import {RequestService} from '../../core/services/request.service';
import {ApiResponse, Collection, CreateCollectionRequest} from '../../core/models/collection.model';
import {Folder, CreateFolderRequest} from '../../core/models/folder.model';
import {TabService} from '../../core/services/tab.service';
import {HttpMethod} from '../../core/models/http-method.enum';
import {Request} from '../../core/models/request.model';
import {Subscription, forkJoin} from 'rxjs';
import {CollaborationService} from '../../core/services/collaboration.service';
import {CollaborationStatus} from '../../core/models/collaboration.model';



@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  activeNavItem: NavItem = 'collections';
  showCollectionsMenu = false;
  menuPosition = { top: '0px', left: '0px' };

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
  currentCollection: Collection | null = null;
  currentCollectionId: number | null = null;
  currentFolder: Folder | null = null;
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
  sharedCollections!: Collection[];
  collectionForm! : CreateCollectionRequest;
  workspaceId! : number

  expandedItems: Set<number> = new Set();
  expandedCollections: Set<number> = new Set();
  expandedFolders: Set<number> = new Set();
  draggedItem: any = null;
  
  // Subscription to handle cleanup
  private subscriptions: Subscription = new Subscription();


  constructor(private route: ActivatedRoute,
              private router: Router,
              private collectionService: CollectionService,
              private folderService: FolderService,
              private requestService: RequestService,
              private collaborationService: CollaborationService,
              private tabService: TabService) {}

  ngOnInit() {
    // Subscribe to route params to get workspace ID
    const routeSub = this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.workspaceId = id;
        console.log('Workspace ID from route:', this.workspaceId);
        this.loadCollections();
      }
    });
    this.subscriptions.add(routeSub);

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
    event.stopPropagation(); // Prevent event bubbling

    // Calculate position based on the button that was clicked
    const buttonRect = (event.target as HTMLElement).closest('button')?.getBoundingClientRect();
    if (buttonRect) {
      this.menuPosition = {
        top: `${buttonRect.bottom + 5}px`,
        left: `${buttonRect.left}px`
      };
    }

    this.showCollectionsMenu = !this.showCollectionsMenu;

    // Add a click listener to close the menu when clicking outside
    if (this.showCollectionsMenu) {
      setTimeout(() => {
        document.addEventListener('click', this.closeCollectionsMenuOnClickOutside);
      }, 10);
    } else {
      document.removeEventListener('click', this.closeCollectionsMenuOnClickOutside);
    }
  }

  // Close the collections menu
  closeCollectionsMenu() {
    this.showCollectionsMenu = false;
    document.removeEventListener('click', this.closeCollectionsMenuOnClickOutside);
  }

  // Toggle item menu (for collection, folder, or request)
  toggleItemMenu(event: MouseEvent, itemType: 'collection' | 'folder' | 'request', itemId: number) {
    event.stopPropagation(); // Prevent event bubbling

    // Calculate position based on the button that was clicked
    const buttonRect = (event.target as HTMLElement).closest('button')?.getBoundingClientRect();
    if (buttonRect) {
      this.itemMenuPosition = {
        top: `${buttonRect.bottom + 5}px`,
        left: `${buttonRect.left}px`
      };
    }

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

    // Add a click listener to close the menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.closeItemMenuOnClickOutside);
    }, 10);
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
    if (!(event.target as HTMLElement).closest('.item-menu-wrapper') &&
        !(event.target as HTMLElement).closest('button[mat-icon-button]')) {
      this.closeItemMenu();
    }
  }

  // Event handler to close menu when clicking outside
  closeCollectionsMenuOnClickOutside = (event: MouseEvent) => {
    if (!(event.target as HTMLElement).closest('.collections-menu-wrapper') &&
        !(event.target as HTMLElement).closest('button[mat-icon-button]')) {
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

  // Create a new request in a collection or folder
  createNewRequest(parentType: 'collection' | 'folder', parentId: number) {
    this.closeItemMenu();
    console.log(`Create new request in ${parentType} with ID: ${parentId}`);
    
    // Check if this is a shared collection or folder
    let isShared = false;
    
    if (parentType === 'collection') {
      const collection = this.findCollectionById(parentId.toString());
      isShared = collection ? !!(collection as any).isShared : false;
    } else if (parentType === 'folder') {
      const collection = this.findCollectionByFolderId(parentId);
      isShared = collection ? !!(collection as any).isShared : false;
    }
    
    // Create a new tab with default values and parent information
    const newTab = this.tabService.createNewTab({
      method: HttpMethod.GET,
      url: 'https://simple-books-api.glitch.me',
      name: `New ${parentType} Request`,
      parentId: parentId,         // Store the parent ID
      parentType: parentType,     // Store the parent type
      isShared: isShared          // Indicate if this is in a shared collection
    });
    
    console.log(`Created new tab with parent ${parentType} ID: ${parentId}, isShared: ${isShared}`);
    
    // The request editor is already integrated in the workspace layout,
    // so we don't need to navigate to a different route
    
    // This parent information can now be used later when saving the request
    // to associate it with the correct collection or folder
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
    
    // Prepare the update request
    const updateRequest = {
      id: this.editFolder.id,
      name: this.editFolder.name.trim(),
      collectionId: this.editFolder.collectionId
    };
    
    // Call the API to update the folder
    this.folderService.updateFolder(updateRequest).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.isSuccess) {
          console.log('Folder updated successfully');
          
          // Update the folder in the UI
          if (this.currentFolder) {
            this.currentFolder.name = this.editFolder.name.trim();
          }
        } else {
          console.error('Failed to update folder:', response.error);
        }
      },
      error: (error) => {
        console.error('Error updating folder:', error);
      },
      complete: () => {
        // Close the modal
        this.closeEditFolderModal();
      }
    });
  }
  
  // Confirm and delete the folder
  confirmDeleteFolder() {
    if (!this.currentFolder) {
      return; // Don't proceed if no folder is selected
    }
    
    // Call the API to delete the folder
    this.folderService.deleteFolder(this.currentFolder.id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.isSuccess) {
          console.log('Folder deleted successfully');
          
          // Remove the folder from the UI
          for (const collection of this.collections) {
            if (collection.folders && collection.id === this.currentFolder?.collectionId) {
              const index = collection.folders.findIndex(f => f.id === this.currentFolder?.id);
              if (index !== -1) {
                collection.folders.splice(index, 1);
                break;
              }
            }
          }
        } else {
          console.error('Failed to delete folder:', response.error);
        }
      },
      error: (error) => {
        console.error('Error deleting folder:', error);
      },
      complete: () => {
        // Close the modal
        this.closeDeleteFolderModal();
      }
    });
  }
  
  // Submit the new folder form
  submitNewFolder() {
    if (!this.newFolder.name.trim() || !this.currentCollectionId) {
      return; // Don't submit if name is empty or no collection is selected
    }
    
    // Prepare the folder creation request
    const folderRequest: CreateFolderRequest = {
      name: this.newFolder.name.trim(),
      collectionId: this.currentCollectionId
    };
    
    // Call the API to create the folder
    this.folderService.createFolder(folderRequest).subscribe({
      next: (response: ApiResponse<Folder>) => {
        if (response.isSuccess && response.data) {
          console.log('Folder created successfully:', response.data);
          
          // Find the collection and add the new folder to it
          const collection = this.collections.find(c => c.id === this.currentCollectionId);
          if (collection) {
            if (!collection.folders) {
              collection.folders = [];
            }
            collection.folders.push(response.data);
            
            // Ensure the collection is expanded to show the new folder
            if (this.currentCollectionId) {
              this.expandedItems.add(this.currentCollectionId);
            }
          }
        } else {
          console.error('Failed to create folder:', response.error);
        }
      },
      error: (error) => {
        console.error('Error creating folder:', error);
      },
      complete: () => {
        // Close the modal
        this.closeNewFolderModal();
      }
    });
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

  // Handle importing a collection
  importCollection() {
    // Implement the import functionality
    console.log('Import collection');
    this.closeCollectionsMenu();
    // You would typically open a file picker or import dialog here
  }

  setActiveNavItem(item: NavItem) {
    this.activeNavItem = item;
  }

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
    
    // Prepare the update request
    const updateRequest = {
      id: this.editCollection.id,
      name: this.editCollection.name.trim(),
      description: this.editCollection.description.trim(),
      workSpaceId: this.workspaceId
    };
    
    // Call the API to update the collection
    this.collectionService.updateCollection(updateRequest).subscribe({
      next: (response: ApiResponse<Collection>) => {
        if (response.isSuccess) {
          console.log('Collection updated successfully:', response.data);
          // Reload collections to get the updated list
          this.loadCollections();
        } else {
          console.error('Failed to update collection:', response.error);
        }
      },
      error: (error) => {
        console.error('Error updating collection:', error);
      }
    });
    
    // Close the modal
    this.closeEditCollectionModal();
  }
  
  // Confirm and delete the collection
  confirmDeleteCollection() {
    if (!this.currentCollection) {
      return; // Don't proceed if no collection is selected
    }
    
    // Call the API to delete the collection
    this.collectionService.deleteCollection(this.currentCollection.id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.isSuccess) {
          console.log('Collection deleted successfully');
          // Reload collections to get the updated list
          this.loadCollections();
        } else {
          console.error('Failed to delete collection:', response.error);
        }
      },
      error: (error) => {
        console.error('Error deleting collection:', error);
      }
    });
    
    // Close the modal
    this.closeDeleteConfirmModal();
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
        }

        // Process shared collections
        if (results.shared.isSuccess && results.shared.data) {
          console.log('Shared collections loaded:', results.shared.data);
          this.sharedCollections = results.shared.data;

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
        }
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.collections = [];
        this.sharedCollections = [];
      }
    });
  }
  
  ngOnDestroy() {
    // Clean up subscriptions when the component is destroyed
    this.subscriptions.unsubscribe();
  }
}
