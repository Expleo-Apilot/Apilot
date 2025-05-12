import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit {
  title = 'apilotLayout';

  // Default split sizes
  sidebarSize: number = 20;
  mainContentSize: number = 60;
  toolsPanelSize: number = 20;

  // Vertical split settings
  requestPaneSize: number = 60;
  responsePaneSize: number = 40;
  panelMinSize: number = 20;

  // Flag to check if we're in browser
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadSplitSizes();
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
