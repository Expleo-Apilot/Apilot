// This is a temporary file to hold the correct implementation of environment-related methods
// for the sidebar component. Copy these methods to the sidebar.component.ts file.

import { Component } from '@angular/core';
import { Environment } from '../../models/environment.model';
import { EnvironmentService } from './environment.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-temp',
  template: ''
})
export class TempFixComponent {
  // Environment properties
  environments: Environment[] = [];
  filteredEnvironments: Environment[] = [];
  environmentSearchTerm: string = '';
  workspaceId: number = 1;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private environmentService: EnvironmentService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Set the active navigation item and load corresponding data
   */
  setActiveNavItem(item: 'collections' | 'environments' | 'flows' | 'history') {
    if (item === 'environments') {
      this.loadEnvironments();
    } else if (item === 'history') {
      this.loadHistories();
    }
  }

  /**
   * Load environments for the current workspace
   * Each workspace has its own environments
   */
  loadEnvironments() {
    // Use workspace ID from route to get workspace-specific environments
    if (!this.workspaceId) {
      // If no workspace ID is available yet, get it from the route
      const routeSub = this.route.params.subscribe(params => {
        const id = +params['id'];
        if (id) {
          this.workspaceId = id;
          this.fetchEnvironmentsByWorkspaceId(this.workspaceId);
        } else {
          console.error('No workspace ID available');
          this.snackBar.open('No workspace ID available', 'Close', { duration: 3000 });
        }
      });
      this.subscriptions.add(routeSub);
    } else {
      // If workspace ID is already available, use it directly
      this.fetchEnvironmentsByWorkspaceId(this.workspaceId);
    }
  }

  /**
   * Fetch environments by workspace ID
   * @param workspaceId The ID of the workspace to get environments for
   */
  private fetchEnvironmentsByWorkspaceId(workspaceId: number) {
    console.log(`Fetching environments for workspace ID: ${workspaceId}`);
    this.environmentService.getEnvironmentsByWorkspaceId(workspaceId).subscribe({
      next: (environments) => {
        this.environments = environments;
        this.filteredEnvironments = [...this.environments];
        console.log(`Loaded ${this.environments.length} environments for workspace ID ${workspaceId}:`, this.environments);
      },
      error: (error) => {
        console.error(`Error loading environments for workspace ID ${workspaceId}:`, error);
        this.snackBar.open('Failed to load environments', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Filter environments based on search term
   * @param searchTerm The search term to filter by
   */
  filterEnvironments(searchTerm: string) {
    this.environmentSearchTerm = searchTerm;
    if (!searchTerm) {
      this.filteredEnvironments = [...this.environments];
      return;
    }
    
    const term = searchTerm.toLowerCase();
    this.filteredEnvironments = this.environments.filter(env => 
      env.name.toLowerCase().includes(term)
    );
  }

  // Placeholder for loadHistories method
  loadHistories() {
    // Implementation would go here
  }
}
