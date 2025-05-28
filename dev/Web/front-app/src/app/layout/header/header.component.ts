import { Component, OnInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { Workspace } from '../../core/models/workspace.model';
import { WorkspaceMenuComponent } from '../../features/workspace/workspace-menu/workspace-menu.component';
import { AuthService } from '../../auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  isDarkMode = false;
  showWorkspaceMenu = false;
  showCreateWorkspaceModal = false;
  showEditWorkspaceModal = false;
  apiIconHovered = false;
  currentUser: any;
  isLoggedIn = false;
  workspaceMenuPosition: { top: string; left: string } = { top: '0px', left: '0px' };
  selectedWorkspace!: Workspace;

  // Workspace related properties
  workspaces: Workspace[] = [];
  selectedWorkspaceId: number | null = null;
  newWorkspace: Partial<Workspace> = { name: '', description: '' };
  editingWorkspace: Workspace | null = null;

  @ViewChild('workspaceMenuContainer') workspaceMenuContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';

    this.applyTheme();

    // Subscribe to auth state changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;

      // Load workspaces when user is logged in
      if (this.isLoggedIn) {
        this.loadWorkspaces();
        this.loadSelectedWorkspace();
      }
    });

    // Check initial auth state
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUser = this.authService.getCurrentUser();

    // Load workspaces if user is logged in
    if (this.isLoggedIn) {
      this.loadWorkspaces();
      this.loadSelectedWorkspace();
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const newTheme = this.isDarkMode ? 'dark' : 'light';

    // Save to localStorage
    localStorage.setItem('theme', newTheme);

    // Add a transition class before changing the theme
    document.body.classList.add('theme-transition');

    // Apply the theme
    this.applyTheme();

    // Remove the transition class after the transition completes
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
  }

  private applyTheme() {
    const body = document.body;
    if (this.isDarkMode) {
      body.classList.add('dark-theme');
      window.dispatchEvent(new CustomEvent('themeChange', { detail: 'vs-dark' }));
    } else {
      body.classList.remove('dark-theme');
      window.dispatchEvent(new CustomEvent('themeChange', { detail: 'vs-light' }));
    }
  }

  // Load all workspaces for the current user
  loadWorkspaces() {
    this.workspaceService.getWorkspaces().subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.workspaces = response.data || [];
          this.cdr.detectChanges();
        } else {
          console.error('Failed to load workspaces:', response.error);
        }
      },
      error: (error) => {
        console.error('Error loading workspaces:', error);
      }
    });
  }

  // Load the previously selected workspace from localStorage
  loadSelectedWorkspace() {
    try {
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        const workspace = JSON.parse(savedWorkspace) as Workspace;
        this.selectedWorkspaceId = workspace.id;
      }
    } catch (error) {
      console.error('Error loading selected workspace:', error);
    }
  }

  // Get the appropriate icon for a workspace
  getWorkspaceIcon(ws: Workspace) {
    return ws.name.toLowerCase().includes('team') ||
           ws.name.toLowerCase().includes('shared') ?
           'groups' : 'lock';
  }

  // Handle workspace selection
  selectWorkspace(ws: Workspace) {
    this.selectedWorkspaceId = ws.id;
    this.loadWorkspaceById(ws.id)
    this.saveSelectedWorkspace(ws);
    this.closeWorkspaceMenu();
  }

  // Save the selected workspace to localStorage
  saveSelectedWorkspace(workspace: Workspace) {
    try {
      localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
    } catch (error) {
      console.error('Error saving workspace to localStorage:', error);
    }
  }

  // Open the create workspace modal
  openCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = true;
    this.newWorkspace = { name: '', description: '' };
  }

  // Close the create workspace modal
  closeCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = false;
  }

  // Create a new workspace
  createWorkspace() {
    if (!this.newWorkspace.name) return;

    this.workspaceService.createWorkspace({
      name: this.newWorkspace.name,
      description: this.newWorkspace.description || '',
      userId: this.currentUser?.id || ''
    }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.loadWorkspaces();
          this.closeCreateWorkspaceModal();
        } else {
          console.error('Failed to create workspace:', response.error);
        }
      },
      error: (error) => {
        console.error('Error creating workspace:', error);
      }
    });
  }

  toggleWorkspaceMenu(event: MouseEvent) {
    // Prevent event propagation to avoid immediate closing
    event.stopPropagation();

    // Calculate position based on the button that was clicked
    const buttonRect = (event.target as HTMLElement).closest('button')?.getBoundingClientRect();
    if (buttonRect) {
      this.workspaceMenuPosition = {
        top: `${buttonRect.bottom}px`,
        left: `${buttonRect.left}px`
      };
    }

    // Use NgZone to run this outside Angular's change detection
    this.ngZone.runOutsideAngular(() => {
      // Toggle menu state
      this.showWorkspaceMenu = !this.showWorkspaceMenu;

      // Run change detection manually
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });

      // If opening the menu, add a click handler to close it when clicking outside
      if (this.showWorkspaceMenu) {
        // Wait until next event cycle before adding listener
        setTimeout(() => {
          document.addEventListener('click', this.closeWorkspaceMenuOnClickOutside);
        }, 10);
      } else {
        document.removeEventListener('click', this.closeWorkspaceMenuOnClickOutside);
      }
    });
  }

  closeWorkspaceMenu() {
    this.ngZone.run(() => {
      this.showWorkspaceMenu = false;
      this.cdr.detectChanges();
    });
    document.removeEventListener('click', this.closeWorkspaceMenuOnClickOutside);
  }

  closeWorkspaceMenuOnClickOutside = (event: MouseEvent) => {
    // Check if the click was outside the menu
    if (
      this.workspaceMenuContainer &&
      !this.workspaceMenuContainer.nativeElement.contains(event.target) &&
      !(event.target as HTMLElement).closest('button[mat-button]')
    ) {
      this.ngZone.run(() => {
        this.closeWorkspaceMenu();
      });
    }
  }

  logout() {
    this.authService.logout();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  loadWorkspaceById(id : number){
    this.workspaceService.getWorkspace(id).subscribe({
      next : (res) => {
        if (res.isSuccess) {
          this.selectedWorkspace = res.data;
          // Save the selected workspace to local storage
          this.saveSelectedWorkspaceToLocalStorage(res.data);
          console.log('Workspace loaded and saved to local storage:', this.selectedWorkspace);
        } else {
          console.error('Error loading workspace:', res.error);
        }
      },
      error : (error) =>{
        console.error('Error loading workspace:', error);
      }
    });
  }

  private saveSelectedWorkspaceToLocalStorage(workspace: Workspace): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
    } catch (e) {
      console.error('Error saving workspace to local storage:', e);
    }
  }

  // Edit workspace
  editWorkspace(workspace: Workspace, event: MouseEvent) {
    // Prevent event propagation to avoid triggering selectWorkspace
    event.stopPropagation();
    
    // Set the workspace to edit
    this.editingWorkspace = { ...workspace };
    this.showEditWorkspaceModal = true;
  }

  // Close edit workspace modal
  closeEditWorkspaceModal() {
    this.showEditWorkspaceModal = false;
    this.editingWorkspace = null;
  }

  // Update workspace
  updateWorkspace() {
    if (!this.editingWorkspace || !this.editingWorkspace.id) return;

    // Create a properly formatted update request
    const updateRequest = {
      id: this.editingWorkspace.id,
      name: this.editingWorkspace.name,
      description: this.editingWorkspace.description || '',
      userId: this.currentUser?.id || ''
    };

    this.workspaceService.updateWorkspace(updateRequest).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          // Refresh the workspaces list
          this.loadWorkspaces();
          this.closeEditWorkspaceModal();
          
          // If the updated workspace is the selected one, update it
          if (this.selectedWorkspaceId === this.editingWorkspace?.id) {
            this.saveSelectedWorkspaceToLocalStorage(response.data);
          }
        } else {
          console.error('Failed to update workspace:', response.error);
        }
      },
      error: (error) => {
        console.error('Error updating workspace:', error);
      }
    });
  }

  // Delete workspace
  deleteWorkspace(workspace: Workspace, event: MouseEvent) {
    // Prevent event propagation to avoid triggering selectWorkspace
    event.stopPropagation();
    
    // Confirm before deleting
    if (confirm(`Are you sure you want to delete the workspace "${workspace.name}"?`)) {
      this.workspaceService.deleteWorkspace(workspace.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            // Refresh the workspaces list
            this.loadWorkspaces();
            
            // If the deleted workspace was the selected one, clear the selection
            if (this.selectedWorkspaceId === workspace.id) {
              this.selectedWorkspaceId = null;
              localStorage.removeItem('selectedWorkspace');
            }
          } else {
            console.error('Failed to delete workspace:', response.error);
          }
        },
        error: (error) => {
          console.error('Error deleting workspace:', error);
        }
      });
    }
  }
}
