import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
export class InviteModalComponent implements OnInit {
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
    this.loadCollections();
  }

  loadCollections(): void {
    // Get the current workspace ID from localStorage
    const workspaceData = localStorage.getItem('selectedWorkspace');
    if (!workspaceData) {
      this.error = 'No workspace selected. Please select a workspace first.';
      return;
    }

    const workspace = JSON.parse(workspaceData);
    this.collectionService.getCollectionsByWorkspaceId(workspace.id).subscribe({
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
