import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {WorkspaceService} from '../../core/services/workspace.service';
import {Workspace} from '../../core/models/workspace.model';

@Component({
  selector: 'app-workspace',
  standalone: false,
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.css'
})
export class WorkspaceComponent implements OnInit{

  sidebarSize: number = 20;
  mainContentSize: number = 60;
  toolsPanelSize: number = 20;
  
  requestPaneSize: number = 60;
  responsePaneSize: number = 40;
  panelMinSize: number = 20;

  private isBrowser: boolean;
  
  currentWorkspace: Workspace | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadSplitSizes();
      
      this.route.paramMap.subscribe(params => {
        const workspaceId = params.get('id');
        const environmentId = params.get('environmentId');
        
        if (workspaceId) {
          this.loadWorkspaceById(Number(workspaceId));
          
          if (environmentId) {
            this.handleEnvironmentSelection(Number(environmentId));
          }
        } else {
          this.loadWorkspaceFromLocalStorage();
        }
      });
    }
  }

  onHorizontalDragEnd(event: any) {
    if (!event.sizes || event.sizes.length !== 3 || !this.isBrowser) return;

    this.sidebarSize = Number(event.sizes[0]);
    this.mainContentSize = Number(event.sizes[1]);
    this.toolsPanelSize = Number(event.sizes[2]);
    localStorage.setItem('horizontalSplitSizes', JSON.stringify(event.sizes));
  }

  onVerticalDragEnd(event: any) {
    if (!event.sizes || event.sizes.length !== 2 || !this.isBrowser) return;

    this.requestPaneSize = Number(event.sizes[0]);
    this.responsePaneSize = Number(event.sizes[1]);
    localStorage.setItem('verticalSplitSizes', JSON.stringify(event.sizes));
  }

  private loadWorkspaceById(id: number) {
    this.workspaceService.getWorkspace(id).subscribe({
      next: (response: any) => {
        if (response.isSuccess) {
          this.currentWorkspace = response.data;
          console.log('Workspace loaded:', response.data);
        } else {
          console.error('Failed to load workspace:', response.error);
        }
      },
      error: (error: any) => {
        console.error('Error loading workspace:', error);
      }
    });
  }
  
  handleEnvironmentSelection(environmentId: number): void {
    console.log(`Environment selected from URL: ${environmentId}`);
  }

  private loadWorkspaceFromLocalStorage() {
    if (!this.isBrowser) return;
    
    try {
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        this.currentWorkspace = JSON.parse(savedWorkspace);
      }
    } catch (error) {
      console.error('Error loading workspace from localStorage:', error);
    }
  }

  private saveWorkspaceToLocalStorage(workspace: Workspace) {
    if (!this.isBrowser) return;
    
    try {
      localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
    } catch (error) {
      console.error('Error saving workspace to localStorage:', error);
    }
  }

  private loadSplitSizes() {
    if (!this.isBrowser) return;

    try {
      const horizontalSizesStr = localStorage.getItem('horizontalSplitSizes');
      if (horizontalSizesStr) {
        const sizes = JSON.parse(horizontalSizesStr);
        if (sizes && sizes.length === 3) {
          this.sidebarSize = Number(sizes[0]);
          this.mainContentSize = Number(sizes[1]);
          this.toolsPanelSize = Number(sizes[2]);
        }
      }

      const verticalSizesStr = localStorage.getItem('verticalSplitSizes');
      if (verticalSizesStr) {
        const sizes = JSON.parse(verticalSizesStr);
        if (sizes && sizes.length === 2) {
          this.requestPaneSize = Number(sizes[0]);
          this.responsePaneSize = Number(sizes[1]);
        }
      }
    } catch (e) {
      console.error('Failed to parse split sizes from localStorage', e);
    }
  }

}
