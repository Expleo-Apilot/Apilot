import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-workspace-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './workspace-menu.component.html',
  styleUrls: ['./workspace-menu.component.css']
})
export class WorkspaceMenuComponent {
  @Output() closeMenu = new EventEmitter<void>();

  search = '';
  workspaces = [
    { id: 1, name: 'apilot Workspace', icon: 'groups', recent: true },
    { id: 2, name: 'Team Workspace', icon: 'groups', recent: true },
    { id: 3, name: 'My Workspace', icon: 'lock', recent: true }
  ];

  get filteredWorkspaces() {
    return this.workspaces.filter(ws => ws.name.toLowerCase().includes(this.search.toLowerCase()));
  }

  get recentWorkspaces() {
    return this.filteredWorkspaces.filter(ws => ws.recent);
  }

  get moreWorkspaces() {
    return this.filteredWorkspaces.filter(ws => !ws.recent);
  }

  createCollection() {
    // Placeholder for create collection logic
    alert('Create Collection clicked!');
  }

  selectWorkspace(ws: any) {
    // Placeholder for workspace selection logic
    this.closeMenu.emit();
  }
}
