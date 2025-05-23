import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace } from '../../../core/models/workspace.model';

@Component({
  selector: 'app-workspace-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './workspace-menu.component.html',
  styleUrls: ['./workspace-menu.component.css']
})
export class WorkspaceMenuComponent implements OnInit {
  @Output() closeMenu = new EventEmitter<void>();
  @Output() workspaceSelected = new EventEmitter<Workspace>();
  @Input() currentUser: any = { name: 'User', avatar: '' };

  search = '';
  workspaces: Workspace[] = [];
  recentWorkspaceIds: number[] = [];
  selectedWorkspaceId: number | null = null;
  showCreateModal = false;
  showEditModal = false;
  modalWorkspace: Partial<Workspace> = {};
  isSubmitting = false;
  errorMsg = '';
  activeTab = 'all'; // 'all', 'personal', 'team', 'public'

  constructor(private workspaceService: WorkspaceService) {}

  ngOnInit() {
    this.loadWorkspaces();
    this.loadRecent();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  loadWorkspaces() {
    this.workspaceService.getWorkspaces().subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.workspaces = res.data || [];
          
          // If no workspaces exist, create some sample ones for demo
          if (this.workspaces.length === 0) {
            this.workspaces = [
              {
                id: 1,
                name: 'My Personal Workspace',
                description: 'Private workspace for personal API testing',
                createdAt: new Date().toISOString(),
                updatedAt: null,
                createdBy: 'User',
                updatedBy: null,
                lastSyncDate: null,
                syncId: '1',
                collections: [],
                environments: [],
                histories: []
              },
              {
                id: 2,
                name: 'Team Project',
                description: 'Shared workspace for the development team',
                createdAt: new Date().toISOString(),
                updatedAt: null,
                createdBy: 'User',
                updatedBy: null,
                lastSyncDate: null,
                syncId: '2',
                collections: [],
                environments: [],
                histories: []
              }
            ];
          }
        }
      }
    });
  }

  loadRecent() {
    if (!this.isBrowser()) {
      this.recentWorkspaceIds = [];
      return;
    }
    const ids = localStorage.getItem('recentWorkspaceIds');
    this.recentWorkspaceIds = ids ? JSON.parse(ids) : [];
  }

  saveRecent(id: number) {
    if (!this.isBrowser()) return;
    if (!this.recentWorkspaceIds.includes(id)) {
      this.recentWorkspaceIds.unshift(id);
      this.recentWorkspaceIds = this.recentWorkspaceIds.slice(0, 5);
      localStorage.setItem('recentWorkspaceIds', JSON.stringify(this.recentWorkspaceIds));
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  get filteredWorkspaces() {
    let filtered = this.workspaces.filter(ws => 
      ws.name.toLowerCase().includes(this.search.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(this.search.toLowerCase()))
    );
    
    if (this.activeTab !== 'all') {
      if (this.activeTab === 'personal') {
        filtered = filtered.filter(ws => this.getWorkspaceIcon(ws) === 'lock');
      } else if (this.activeTab === 'team') {
        filtered = filtered.filter(ws => this.getWorkspaceIcon(ws) === 'groups');
      }
    }
    
    return filtered;
  }

  get recentWorkspaces() {
    return this.filteredWorkspaces.filter(ws => this.recentWorkspaceIds.includes(ws.id));
  }

  get moreWorkspaces() {
    return this.filteredWorkspaces.filter(ws => !this.recentWorkspaceIds.includes(ws.id));
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.modalWorkspace = { name: '', description: '' };
    this.errorMsg = '';
  }

  openEditModal(ws: Workspace) {
    this.showEditModal = true;
    this.modalWorkspace = { ...ws };
    this.errorMsg = '';
  }

  closeModal() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.modalWorkspace = {};
    this.errorMsg = '';
  }

  createWorkspace() {
    if (!this.modalWorkspace.name) return;
    this.isSubmitting = true;
    this.workspaceService.createWorkspace({
      name: this.modalWorkspace.name!,
      description: this.modalWorkspace.description || ''
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          this.loadWorkspaces();
          this.closeModal();
        } else {
          this.errorMsg = res.error || 'Failed to create workspace';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMsg = err.message || 'Failed to create workspace';
      }
    });
  }

  updateWorkspace() {
    if (!this.modalWorkspace.id || !this.modalWorkspace.name) return;
    this.isSubmitting = true;
    this.workspaceService.updateWorkspace({
      id: this.modalWorkspace.id,
      name: this.modalWorkspace.name,
      description: this.modalWorkspace.description || ''
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          this.loadWorkspaces();
          this.closeModal();
        } else {
          this.errorMsg = res.error || 'Failed to update workspace';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMsg = err.message || 'Failed to update workspace';
      }
    });
  }

  deleteWorkspace(ws: Workspace, event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (!confirm('Delete this workspace?')) return;
    this.workspaceService.deleteWorkspace(ws.id).subscribe({
      next: (res) => {
        if (res.isSuccess) this.loadWorkspaces();
      }
    });
  }

  selectWorkspace(ws: Workspace) {
    this.selectedWorkspaceId = ws.id;
    this.saveRecent(ws.id);
    this.workspaceSelected.emit(ws);
    this.closeMenu.emit();
  }

  getWorkspaceIcon(ws: Workspace) {
    return ws.name.toLowerCase().includes('team') || 
           ws.name.toLowerCase().includes('shared') ? 
           'groups' : 'lock';
  }
}
