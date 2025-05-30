import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Collection } from '../../../core/models/collection.model';
import { Folder } from '../../../core/models/folder.model';
import { CollectionService } from '../../../core/services/collection.service';
import { ActivatedRoute } from '@angular/router';

export interface SaveRequestDialogData {
  workspaceId: number;
  requestName: string;
}

export interface SaveLocation {
  type: 'collection' | 'folder';
  id: number;
}

@Component({
  selector: 'app-save-request-modal',
  templateUrl: './save-request-modal.component.html',
  styleUrls: ['./save-request-modal.component.css'],
  standalone: false
})
export class SaveRequestModalComponent implements OnInit {
  collections: Collection[] = [];
  expandedCollections: Set<number> = new Set();
  selectedLocation: SaveLocation | null = null;
  requestName: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  workspaceId: number = 0;

  constructor(
    public dialogRef: MatDialogRef<SaveRequestModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SaveRequestDialogData,
    private collectionService: CollectionService,
    private route: ActivatedRoute
  ) {
    this.requestName = data.requestName || 'New Request';
  }

  ngOnInit(): void {
    // Get workspace ID from URL path
    const currentUrl = window.location.pathname;
    const match = currentUrl.match(/\/workspace\/(\d+)/);
    
    if (match && match[1]) {
      this.workspaceId = +match[1];
      console.log('Workspace ID from URL path:', this.workspaceId);
      this.loadCollections();
    } else {
      // Fallback to dialog data if path extraction fails
      this.workspaceId = this.data.workspaceId;
      console.log('Fallback to dialog data. Workspace ID:', this.workspaceId);
      this.loadCollections();
    }
  }

  loadCollections(): void {
    this.isLoading = true;
    this.error = null;


    this.collectionService.getCollectionsByWorkspaceId(this.workspaceId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.collections = response.data;
          console.log(response.data)
          // Initialize folders array if it doesn't exist
          this.collections.forEach(collection => {
            if (!collection.folders) {
              collection.folders = [];
            }
          });

          // If there's at least one collection, expand it by default
          if (this.collections.length > 0) {
            this.expandedCollections.add(this.collections[0].id);
          }
        } else {
          this.error = response.error || 'Failed to load collections';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error loading collections. Please try again.';
        this.isLoading = false;
      }
    });
  }

  toggleCollectionExpand(collectionId: number, event: Event): void {
    event.stopPropagation();
    if (this.expandedCollections.has(collectionId)) {
      this.expandedCollections.delete(collectionId);
    } else {
      this.expandedCollections.add(collectionId);
    }
  }

  isCollectionExpanded(collectionId: number): boolean {
    return this.expandedCollections.has(collectionId);
  }

  selectCollection(collection: Collection, event: Event): void {
    event.stopPropagation();
    this.selectedLocation = {
      type: 'collection',
      id: collection.id
    };
  }

  selectFolder(folder: Folder, event: Event): void {
    event.stopPropagation();
    this.selectedLocation = {
      type: 'folder',
      id: folder.id
    };
  }

  isSelected(type: 'collection' | 'folder', id: number): boolean {
    return this.selectedLocation?.type === type && this.selectedLocation?.id === id;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.selectedLocation) {
      return;
    }

    this.dialogRef.close({
      location: this.selectedLocation,
      name: this.requestName
    });

  }
}
