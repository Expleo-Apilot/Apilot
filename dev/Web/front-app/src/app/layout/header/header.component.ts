import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Workspace } from '../../core/models/workspace.model';
import { WorkspaceMenuComponent } from '../../features/workspace/workspace-menu/workspace-menu.component';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  isDarkMode = false;
  showWorkspaceMenu = false;
  apiIconHovered = false;
  currentUser: any;
  isLoggedIn = false;
  workspaceMenuPosition: { top: string; left: string } = { top: '0px', left: '0px' };
  
  @ViewChild('workspaceMenuContainer') workspaceMenuContainer!: ElementRef;
  
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';

    this.applyTheme();
    
    // Subscribe to auth state changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
    
    // Check initial auth state
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUser = this.authService.getCurrentUser();
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

  onWorkspaceSelected(ws: Workspace) {
    // Handle workspace selection (update app state, etc.)
    this.showWorkspaceMenu = false;
    console.log('Selected workspace:', ws.name);
    // Here you would typically update the application state with the selected workspace
  }

  toggleWorkspaceMenu(event: MouseEvent) {
    // Calculate position based on the button that was clicked
    const buttonRect = (event.target as HTMLElement).closest('button')?.getBoundingClientRect();
    if (buttonRect) {
      this.workspaceMenuPosition = {
        top: `${buttonRect.bottom}px`,
        left: `${buttonRect.left}px`
      };
    }
    
    this.showWorkspaceMenu = !this.showWorkspaceMenu;
    
    // If opening the menu, add a click handler to close it when clicking outside
    if (this.showWorkspaceMenu) {
      setTimeout(() => {
        document.addEventListener('click', this.closeWorkspaceMenuOnClickOutside);
      }, 0);
    }
  }

  closeWorkspaceMenu() {
    this.showWorkspaceMenu = false;
    document.removeEventListener('click', this.closeWorkspaceMenuOnClickOutside);
  }

  closeWorkspaceMenuOnClickOutside = (event: MouseEvent) => {
    // Check if the click was outside the menu
    if (
      this.workspaceMenuContainer && 
      !this.workspaceMenuContainer.nativeElement.contains(event.target) &&
      !(event.target as HTMLElement).closest('button[mat-button]')
    ) {
      this.closeWorkspaceMenu();
    }
  }
  
  logout() {
    this.authService.logout();
  }
}
