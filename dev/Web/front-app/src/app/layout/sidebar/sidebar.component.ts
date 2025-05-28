// src/app/layout/sidebar/sidebar.component.ts
import {Component, OnInit} from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {ActivatedRoute} from '@angular/router';
import {CollectionService} from '../../core/services/collection.service';
import {ApiResponse, Collection, CreateCollectionRequest} from '../../core/models/collection.model';
import {Folder} from '../../core/models/folder.model';
import {Request} from '../../core/models/request.model';

// Local interface for temporary requests if needed
interface SimpleRequest {
  id: string;
  name: string;
  method: string;
  url: string;
}



@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit{
  activeNavItem: string = 'collections';
  showCollectionsMenu = false;
  menuPosition = { top: '0px', left: '0px' };

  // New collection modal state
  showNewCollectionModal = false;
  newCollection = {
    name: '',
    description: ''
  };
  collections!: Collection[];
  collectionForm! : CreateCollectionRequest;
  workspaceId! : number

  expandedItems: Set<number> = new Set();
  draggedItem: any = null;


  constructor(private route: ActivatedRoute,
              private collectionService : CollectionService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.workspaceId = id;
        console.log('Workspace ID from route:', this.workspaceId);
        this.loadCollections()
      }
    });

    // Initialize your collectionForm properly here to avoid undefined errors
    this.collectionForm = {
      name: '',
      description: '',
      workSpaceId: 0
    };


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

  // Handle importing a collection
  importCollection() {
    // Implement the import functionality
    console.log('Import collection');
    this.closeCollectionsMenu();
    // You would typically open a file picker or import dialog here
  }

  setActiveNavItem(item: string) {
    this.activeNavItem = item;
  }

  toggleExpand(id: number) {
    if (this.expandedItems.has(id)) {
      this.expandedItems.delete(id);
    } else {
      this.expandedItems.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedItems.has(id);
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
    return this.collections.find(collection =>
      collection.folders && collection.folders.some(folder => folder.id === folderId)
    );
  }

  findCollectionById(collectionId: string): Collection | undefined {
    // Convert collection.id (number) to string for comparison
    return this.collections.find(collection => collection.id.toString() === collectionId);
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


  loadCollections() {
    this.collectionService.getCollectionsByWorkspaceId(this.workspaceId).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          console.log('Collections loaded:', res.data);
          this.collections = res.data;

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
          console.error('Failed to load collections:', res.error);
          this.collections = [];
        }
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.collections = [];
      }
    });
  }
}
