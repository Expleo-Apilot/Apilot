import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Workspace } from '../../../core/models/workspace.model';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ]
})
export class WorkspaceComponent implements OnInit {
  showMenu = false;
  showModal = false;
  workspaceForm: FormGroup;
  isSubmitting = false;
  submitSuccess: boolean | null = null;
  submitError: string | null = null;
  workspaces: Workspace[] = [];
  selectedWorkspace: Workspace | null = null;

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService
  ) {
    this.workspaceForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.workspaceService.getWorkspaces().subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.workspaces = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading workspaces:', error);
      }
    });
  }

  openMenu() {
    this.showMenu = !this.showMenu;
  }

  openCreateModal() {
    this.showModal = true;
    this.showMenu = false;
    this.workspaceForm.reset();
    this.submitSuccess = null;
    this.submitError = null;
  }

  closeModal() {
    this.showModal = false;
  }

  submitWorkspace() {
    if (this.workspaceForm.invalid) return;
    
    this.isSubmitting = true;
    this.submitSuccess = null;
    this.submitError = null;

    this.workspaceService.createWorkspace(this.workspaceForm.value).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitSuccess = response.isSuccess;
        if (response.isSuccess) {
          this.closeModal();
          this.loadWorkspaces();
        } else {
          this.submitError = response.error || 'Failed to create workspace';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = err.message || 'Failed to create workspace';
      }
    });
  }

  deleteWorkspace(id: number) {
    if (confirm('Are you sure you want to delete this workspace?')) {
      this.workspaceService.deleteWorkspace(id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadWorkspaces();
          }
        },
        error: (error) => {
          console.error('Error deleting workspace:', error);
        }
      });
    }
  }

  selectWorkspace(workspace: Workspace) {
    this.selectedWorkspace = workspace;
  }
}
