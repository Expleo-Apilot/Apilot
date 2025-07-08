import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Collection } from '../../../core/models/collection.model';
import { CollaborationPermission } from '../../../core/models/collaboration.model';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { CollectionService } from '../../../core/services/collection.service';

@Component({
  selector: 'app-invite-modal',
  standalone: false,
  templateUrl: './invite-modal.component.html',
  styleUrls: ['./invite-modal.component.css']
})
export class InviteModalComponent implements OnInit, OnChanges {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  inviteForm: FormGroup;
  collections: Collection[] = [];
  loading = false;
  error = '';
  success = '';

  // Expose enum to template
  CollaborationPermission = CollaborationPermission;

  constructor(
    private fb: FormBuilder,
    private collaborationService: CollaborationService,
    private collectionService: CollectionService
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      collectionId: ['', Validators.required],
      permission: [CollaborationPermission.View, Validators.required]
    });
  }

  ngOnInit(): void {
    // Initial load of collections
    if (this.show) {
      this.loadCollections();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload collections whenever the modal is shown
    if (changes['show'] && changes['show'].currentValue === true) {
      this.loadCollections();
    }
  }

  loadCollections(): void {
    // Extract workspace ID from URL path
    const currentUrl = window.location.pathname;
    const match = currentUrl.match(/\/workspace\/(\d+)/);
    let workspaceId: number;

    if (match && match[1]) {
      // Use workspace ID from URL path
      workspaceId = +match[1];
      console.log('Workspace ID from URL path:', workspaceId);
    } else {
      // Fallback to localStorage if path extraction fails
      const workspaceData = localStorage.getItem('selectedWorkspace');
      if (!workspaceData) {
        this.error = 'No workspace selected. Please select a workspace first.';
        return;
      }
      const workspace = JSON.parse(workspaceData);
      workspaceId = workspace.id;
      console.log('Fallback to localStorage. Workspace ID:', workspaceId);
    }

    // Reset collections and form
    this.collections = [];
    this.error = '';

    this.collectionService.getCollectionsByWorkspaceId(workspaceId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.collections = response.data;
          if (this.collections.length > 0) {
            this.inviteForm.patchValue({ collectionId: this.collections[0].id });
          }
        } else {
          this.error = 'Failed to load collections: ' + (response.error || 'Unknown error');
        }
      },
      error: (err) => {
        this.error = 'Error loading collections: ' + (err.message || 'Unknown error');
      }
    });
  }

  onSubmit(): void {

    if (this.inviteForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.collaborationService.createCollaboration({
      collectionId: this.inviteForm.value.collectionId,
      email: this.inviteForm.value.email,
      permission: this.inviteForm.value.permission
    }).subscribe({
      next: (response) => {
        this.loading = false;
        console.log(response);
        if (response.success) {
          this.success = 'Invitation sent successfully!';
          // Reset form after successful submission
          this.inviteForm.patchValue({
            email: '',
            permission: CollaborationPermission.View
          });

          // Close modal after 2 seconds
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        } else {
          this.error = response.message || 'Failed to send invitation';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || err.message || 'An error occurred while sending the invitation';
      }
    });
  }

  closeModal(): void {
    this.close.emit();
    this.error = '';
    this.success = '';
    this.inviteForm.reset({
      permission: CollaborationPermission.View
    });
  }

  getPermissionLabel(permission: CollaborationPermission): string {
    return CollaborationPermission[permission];
  }
}
