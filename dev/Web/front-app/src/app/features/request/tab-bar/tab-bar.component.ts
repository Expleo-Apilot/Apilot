import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TabService, RequestTab } from '../../../core/services/tab.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class TabBarComponent implements OnInit, OnDestroy {
  tabs: RequestTab[] = [];
  activeTabId: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    public tabService: TabService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Subscribe to tabs changes
    this.subscriptions.push(
      this.tabService.tabs$.subscribe(tabs => {
        this.tabs = tabs;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to active tab changes
    this.subscriptions.push(
      this.tabService.activeTabId$.subscribe(id => {
        this.activeTabId = id;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  createNewTab(): void {
    this.tabService.createNewTab();
  }

  closeTab(event: MouseEvent, tabId: string): void {
    event.stopPropagation(); // Prevent the click from activating the tab
    this.tabService.closeTab(tabId);
  }

  activateTab(tabId: string): void {
    this.tabService.activateTab(tabId);
  }

  // Determine if tab is active
  isTabActive(tabId: string): boolean {
    return tabId === this.activeTabId;
  }
}
