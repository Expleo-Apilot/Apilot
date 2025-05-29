import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpMethod } from '../models/http-method.enum';
import { AuthType } from '../models/auth-type.enum';
import { KeyValuePair } from '../models/request.model';

export interface RequestTab {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: 'none' | 'json' | 'text' | 'form';
  authType: AuthType;
  basicAuthUsername: string;
  basicAuthPassword: string;
  bearerToken: string;
  active: boolean;
  parentId?: number;           // ID of parent collection or folder
  parentType?: 'collection' | 'folder';  // Type of parent
}

@Injectable({
  providedIn: 'root'
})
export class TabService {
  private readonly STORAGE_KEY = 'apilot_tabs';
  private _tabs = new BehaviorSubject<RequestTab[]>([]);
  private _activeTabId = new BehaviorSubject<string | null>(null);

  constructor() {
    this.loadTabsFromStorage();
  }

  get tabs$(): Observable<RequestTab[]> {
    return this._tabs.asObservable();
  }

  get tabs(): RequestTab[] {
    return this._tabs.getValue();
  }

  get activeTabId$(): Observable<string | null> {
    return this._activeTabId.asObservable();
  }

  get activeTabId(): string | null {
    return this._activeTabId.getValue();
  }

  get activeTab(): RequestTab | null {
    const id = this.activeTabId;
    if (!id) return null;
    return this.tabs.find(tab => tab.id === id) || null;
  }

  private loadTabsFromStorage(): void {
    try {
      const storedTabs = localStorage.getItem(this.STORAGE_KEY);
      if (storedTabs) {
        const tabs = JSON.parse(storedTabs) as RequestTab[];
        
        // If there are tabs but no active tab, set the first one as active
        if (tabs.length > 0) {
          const activeTab = tabs.find(tab => tab.active);
          if (!activeTab) {
            tabs[0].active = true;
          }
          this._tabs.next(tabs);
          this._activeTabId.next(tabs.find(tab => tab.active)?.id || tabs[0].id);
        } else {
          this.createNewTab();
        }
      } else {
        this.createNewTab();
      }
    } catch (error) {
      console.error('Error loading tabs from storage:', error);
      this.createNewTab();
    }
  }

  private saveTabsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tabs));
    } catch (error) {
      console.error('Error saving tabs to storage:', error);
    }
  }

  createNewTab(initialData?: Partial<RequestTab>): RequestTab {
    const tabs = this.tabs;
    
    // Set all existing tabs as inactive
    tabs.forEach(tab => tab.active = false);
    
    // Create a new tab with default values
    const newTab: RequestTab = {
      id: this.generateId(),
      name: initialData?.name || 'New Request',
      url: initialData?.url || 'https://simple-books-api.glitch.me',
      method: initialData?.method || HttpMethod.GET,
      params: initialData?.params || [{ key: '', value: '', enabled: true }],
      headers: initialData?.headers || [{ key: '', value: '', enabled: true }],
      body: initialData?.body || '{\n  "key": "value"\n}',
      bodyType: initialData?.bodyType || 'json',
      authType: initialData?.authType || AuthType.NONE,
      basicAuthUsername: initialData?.basicAuthUsername || '',
      basicAuthPassword: initialData?.basicAuthPassword || '',
      bearerToken: initialData?.bearerToken || '',
      active: true,
      parentId: initialData?.parentId,
      parentType: initialData?.parentType
    };
    
    tabs.push(newTab);
    this._tabs.next(tabs);
    this._activeTabId.next(newTab.id);
    this.saveTabsToStorage();
    
    return newTab;
  }

  closeTab(tabId: string): void {
    let tabs = this.tabs;
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    
    if (tabIndex === -1) return;
    
    const isActiveTab = tabs[tabIndex].active;
    tabs = tabs.filter(tab => tab.id !== tabId);
    
    // If we closed the active tab and there are other tabs, make another one active
    if (isActiveTab && tabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, tabs.length - 1);
      tabs[newActiveIndex].active = true;
      this._activeTabId.next(tabs[newActiveIndex].id);
    } else if (tabs.length === 0) {
      // If we closed the last tab, create a new one
      this._tabs.next(tabs);
      this.createNewTab();
      return;
    }
    
    this._tabs.next(tabs);
    this.saveTabsToStorage();
  }

  activateTab(tabId: string): void {
    const tabs = this.tabs;
    const tab = tabs.find(t => t.id === tabId);
    
    if (!tab) return;
    
    // Deactivate all tabs
    tabs.forEach(t => t.active = false);
    
    // Activate the selected tab
    tab.active = true;
    this._activeTabId.next(tabId);
    
    this._tabs.next(tabs);
    this.saveTabsToStorage();
  }

  updateTabData(tabId: string, data: Partial<RequestTab>): void {
    const tabs = this.tabs;
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    
    if (tabIndex === -1) return;
    
    // Update the tab with new data
    tabs[tabIndex] = { ...tabs[tabIndex], ...data };
    
    // If the URL changed, update the tab name based on the URL
    if (data.url && data.url !== tabs[tabIndex].url) {
      tabs[tabIndex].name = this.generateTabNameFromUrl(data.url);
    }
    
    this._tabs.next(tabs);
    this.saveTabsToStorage();
  }

  private generateTabNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length > 0) {
        // Use the last meaningful part of the path
        return pathParts[pathParts.length - 1];
      } else {
        // If no path, use the hostname
        return urlObj.hostname;
      }
    } catch (e) {
      // If URL parsing fails, extract what looks like a path
      const parts = url.split('/').filter(Boolean);
      if (parts.length > 0) {
        // Try to find a part that's not http or https
        const nonProtocolPart = parts.find(part => !part.includes('http') && !part.includes('www.'));
        return nonProtocolPart || 'New Request';
      }
      return 'New Request';
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}
