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
