// src/app/layout/sidebar/sidebar.component.ts
import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
}

interface Folder {
  id: string;
  name: string;
  requests: Request[];
  folders: Folder[];
}

interface Collection {
  id: string;
  name: string;
  folders: Folder[];
  requests: Request[];
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  activeNavItem: string = 'collections';
  showCollectionsMenu = false;
  menuPosition = { top: '0px', left: '0px' };
  collections: Collection[] = [
    {
      id: '1',
      name: 'End-to-End Tests',
      folders: [
        {
          id: '1-1',
          name: 'Transaction Tests',
          folders: [],
          requests: [
            {
              id: '1-1-1',
              name: 'Process a VALID transaction',
              method: 'POST',
              url: '/api/transactions'
            },
            {
              id: '1-1-2',
              name: 'Attempt an INVALID transaction',
              method: 'POST',
              url: '/api/transactions'
            }
          ]
        }
      ],
      requests: []
    },
    {
      id: '2',
      name: 'API Documentation',
      folders: [],
      requests: [
        {
          id: '2-1',
          name: 'Get API Info',
          method: 'GET',
          url: '/api/info'
        }
      ]
    }
  ];

  expandedItems: Set<string> = new Set();
  draggedItem: any = null;

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
    // Implement the creation of a new collection
    console.log('Create new collection');
    this.closeCollectionsMenu();
    // You would typically open a modal or form here
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

  toggleExpand(id: string) {
    if (this.expandedItems.has(id)) {
      this.expandedItems.delete(id);
    } else {
      this.expandedItems.add(id);
    }
  }

  isExpanded(id: string): boolean {
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
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const item = event.item.data;
      const isFolder = 'folders' in item;

      if (isFolder) {
        // Moving a folder
        const sourceCollection = this.findCollectionByFolderId(item.id);
        const targetCollection = this.findCollectionById(event.container.id.replace('collection-', ''));

        if (sourceCollection && targetCollection && sourceCollection !== targetCollection) {
          const sourceIndex = sourceCollection.folders.findIndex(f => f.id === item.id);
          if (sourceIndex > -1) {
            // Remove from source
            const [movedFolder] = sourceCollection.folders.splice(sourceIndex, 1);

            // Add to target at the correct position
            const targetIndex = Math.min(event.currentIndex, targetCollection.folders.length);
            targetCollection.folders.splice(targetIndex, 0, movedFolder);

            // Ensure the target collection is expanded
            this.expandedItems.add(targetCollection.id);
          }
        }
      } else {
        // Moving a request
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
    }
  }

  findCollectionByFolderId(folderId: string): Collection | undefined {
    return this.collections.find(collection =>
      collection.folders.some(folder => folder.id === folderId)
    );
  }

  findCollectionById(collectionId: string): Collection | undefined {
    return this.collections.find(collection => collection.id === collectionId);
  }

  getConnectedLists(): string[] {
    return this.collections.map(c => `collection-${c.id}`);
  }

  getFolderConnectedLists(folder: Folder): string[] {
    return [
      ...folder.folders.map(f => `folder-${f.id}`),
      ...this.collections.map(c => `collection-${c.id}`)
    ];
  }
}
