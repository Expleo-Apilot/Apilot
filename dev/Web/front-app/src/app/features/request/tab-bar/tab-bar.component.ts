import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TabService, RequestTab } from '../../../core/services/tab.service';
import { Subscription } from 'rxjs';
import { HttpMethod } from '../../../core/models/http-method.enum';

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
export class TabBarComponent implements OnInit, OnDestroy, AfterViewInit {
  tabs: RequestTab[] = [];
  activeTabId: string | null = null;
  private subscriptions: Subscription[] = [];
  
  // Scroll state
  showLeftScroll = false;
  showRightScroll = false;
  private scrollAmount = 200; // Amount to scroll on button click
  
  @ViewChild('tabsWrapper') tabsWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('tabsScrollArea') tabsScrollArea!: ElementRef<HTMLDivElement>;
  @ViewChild('tabBarContainer') tabBarContainer!: ElementRef<HTMLDivElement>;

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
        
        // Check scroll status after tabs change
        setTimeout(() => this.checkScroll(), 100);
      })
    );

    // Subscribe to active tab changes
    this.subscriptions.push(
      this.tabService.activeTabId$.subscribe(id => {
        this.activeTabId = id;
        this.cdr.detectChanges();
        
        // Scroll to active tab when it changes
        if (id) {
          setTimeout(() => this.scrollToActiveTab(), 100);
        }
      })
    );
  }
  
  ngAfterViewInit(): void {
    // Initial scroll check
    setTimeout(() => {
      this.checkScroll();
      this.scrollToActiveTab();
    }, 100);
  }
  
  @HostListener('window:resize')
  onResize(): void {
    this.checkScroll();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // Scroll handling methods
  onScroll(): void {
    this.checkScroll();
  }
  
  checkScroll(): void {
    if (!this.tabsWrapper || !this.tabsScrollArea) return;
    
    const wrapper = this.tabsWrapper.nativeElement;
    const scrollArea = this.tabsScrollArea.nativeElement;
    
    // Check if scrolling is needed
    this.showLeftScroll = wrapper.scrollLeft > 0;
    this.showRightScroll = wrapper.scrollLeft < (scrollArea.scrollWidth - wrapper.clientWidth - 5);
    
    this.cdr.detectChanges();
  }
  
  scrollLeft(): void {
    if (!this.tabsWrapper) return;
    const wrapper = this.tabsWrapper.nativeElement;
    wrapper.scrollBy({ left: -this.scrollAmount, behavior: 'smooth' });
  }
  
  scrollRight(): void {
    if (!this.tabsWrapper) return;
    const wrapper = this.tabsWrapper.nativeElement;
    wrapper.scrollBy({ left: this.scrollAmount, behavior: 'smooth' });
  }
  
  scrollToActiveTab(): void {
    if (!this.activeTabId || !this.tabsWrapper) return;
    
    const activeTabElement = this.tabBarContainer.nativeElement.querySelector('.tab.active') as HTMLElement;
    if (!activeTabElement) return;
    
    const wrapper = this.tabsWrapper.nativeElement;
    const tabLeft = activeTabElement.offsetLeft;
    const tabWidth = activeTabElement.offsetWidth;
    const wrapperWidth = wrapper.clientWidth;
    const scrollLeft = wrapper.scrollLeft;
    
    // If tab is not fully visible, scroll to make it visible
    if (tabLeft < scrollLeft) {
      // Tab is to the left of the visible area
      wrapper.scrollTo({ left: tabLeft - 10, behavior: 'smooth' });
    } else if ((tabLeft + tabWidth) > (scrollLeft + wrapperWidth)) {
      // Tab is to the right of the visible area
      wrapper.scrollTo({ left: tabLeft - wrapperWidth + tabWidth + 10, behavior: 'smooth' });
    }
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
  
  // Method indicator helpers
  isGetMethod(method: HttpMethod): boolean {
    return method === HttpMethod.GET;
  }
  
  isPostMethod(method: HttpMethod): boolean {
    return method === HttpMethod.POST;
  }
  
  isPutMethod(method: HttpMethod): boolean {
    return method === HttpMethod.PUT;
  }
  
  isDeleteMethod(method: HttpMethod): boolean {
    return method === HttpMethod.DELETE;
  }
  
  isPatchMethod(method: HttpMethod): boolean {
    return method === HttpMethod.PATCH;
  }
  
  isOptionsMethod(method: HttpMethod): boolean {
    return method === HttpMethod.OPTIONS || method === HttpMethod.HEAD;
  }
}
