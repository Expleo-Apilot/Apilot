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
  parentId?: number;
  parentType?: 'collection' | 'folder';
  isShared?: boolean;
  targetType?: 'collection' | 'folder';
  targetId?: number;
  script?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TabService {
  private readonly STORAGE_KEY = 'apilot_tabs';
  private readonly SELECTED_REQUEST_KEY = 'apilot_selected_request_';
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

    tabs.forEach(tab => tab.active = false);

    const newTab: RequestTab = {
      id: this.generateId(),
      name: initialData?.name || 'New Request',
      url: initialData?.url || '',
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
      parentType: initialData?.parentType,
      isShared: initialData?.isShared,
      targetType: initialData?.targetType,
      targetId: initialData?.targetId,
      script: initialData?.script || ''
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

    if (isActiveTab && tabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, tabs.length - 1);
      tabs[newActiveIndex].active = true;
      this._activeTabId.next(tabs[newActiveIndex].id);
    } else if (tabs.length === 0) {
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

    tabs.forEach(t => t.active = false);

    tab.active = true;
    this._activeTabId.next(tabId);

    this.storeSelectedRequestDetails(tab);

    this._tabs.next(tabs);
    this.saveTabsToStorage();
  }

  updateTabData(tabId: string, data: Partial<RequestTab>): void {
    const tabs = this.tabs;
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);

    if (tabIndex === -1) return;

    tabs[tabIndex] = { ...tabs[tabIndex], ...data };

    if (data.url && data.url !== tabs[tabIndex].url) {
      tabs[tabIndex].name = this.generateTabNameFromUrl(data.url);
    }

    this._tabs.next(tabs);
    this.saveTabsToStorage();
    
    // If this is the active tab, store its details in localStorage
    if (tabs[tabIndex].active) {
      this.storeSelectedRequestDetails(tabs[tabIndex]);
    }
  }

  /**
   * Close all open tabs and create a new empty tab
   */
  closeAllTabs(): void {
    const newTab: RequestTab = {
      id: this.generateId(),
      name: 'New Request',
      url: '',
      method: HttpMethod.GET,
      params: [{ key: '', value: '', enabled: true }],
      headers: [{ key: '', value: '', enabled: true }],
      body: '{\n  "key": "value"\n}',
      bodyType: 'json',
      authType: AuthType.NONE,
      basicAuthUsername: '',
      basicAuthPassword: '',
      bearerToken: '',
      active: true
    };
    
    // Set tabs to just the one new tab
    this._tabs.next([newTab]);
    this._activeTabId.next(newTab.id);
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

  /**
   * Stores the selected request details in localStorage using the request name as part of the key
   * This enables persistence of the selected request across sessions
   * @param tab The tab containing the request details to store
   */
  private storeSelectedRequestDetails(tab: RequestTab): void {
    if (!tab || !tab.name) return;
    
    try {
      // Create a unique key for this request using its name, parentId and a timestamp
      const timestamp = new Date().getTime();
      const sanitizedName = tab.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const parentIdSuffix = tab.parentId ? `_parent_${tab.parentId}` : '';
      const storageKey = `${this.SELECTED_REQUEST_KEY}${sanitizedName}${parentIdSuffix}_${timestamp}`;
      
      // Store the request details
      const requestDetails = {
        id: tab.id,
        name: tab.name,
        url: tab.url,
        method: tab.method,
        params: tab.params,
        headers: tab.headers,
        body: tab.body,
        bodyType: tab.bodyType,
        authType: tab.authType,
        basicAuthUsername: tab.basicAuthUsername,
        basicAuthPassword: tab.basicAuthPassword,
        bearerToken: tab.bearerToken,
        parentId: tab.parentId,
        parentType: tab.parentType,
        isShared: tab.isShared,
        lastSelected: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(requestDetails));
      
      // Store the key of the most recently selected request
      localStorage.setItem('apilot_last_selected_request', storageKey);
      
      // Store the parentId separately for quick access
      if (tab.parentId) {
        localStorage.setItem('apilot_last_selected_request_parentId', tab.parentId.toString());
      } else {
        // Clear the parentId if it's not set
        localStorage.removeItem('apilot_last_selected_request_parentId');
      }
    } catch (error) {
      console.error('Error storing selected request details:', error);
    }
  }
  
  /**
   * Retrieves the selected request details from localStorage
   * @param requestName Optional name of the request to retrieve, if not provided returns the last selected request
   * @returns The request details or null if not found
   */
  getSelectedRequestDetails(requestName?: string): any {
    try {
      if (requestName) {
        // Create a sanitized key from the request name
        const sanitizedName = requestName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        // Find all keys that match the pattern
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith(`${this.SELECTED_REQUEST_KEY}${sanitizedName}_`));
        
        if (keys.length > 0) {
          // Sort by last selected date if available
          const sortedKeys = keys.sort((a, b) => {
            const aData = JSON.parse(localStorage.getItem(a) || '{}');
            const bData = JSON.parse(localStorage.getItem(b) || '{}');
            return (bData.lastSelected || '').localeCompare(aData.lastSelected || '');
          });
          
          // Return the most recently selected one
          const result = JSON.parse(localStorage.getItem(sortedKeys[0]) || 'null');
          
          // If parentId is not in the result but we have it in localStorage, add it
          if (result && !result.parentId) {
            const parentId = localStorage.getItem('apilot_last_selected_request_parentId');
            if (parentId) {
              result.parentId = parseInt(parentId, 10);
            }
          }
          
          return result;
        }
        return null;
      } else {
        // Return the last selected request
        const lastSelectedKey = localStorage.getItem('apilot_last_selected_request');
        if (lastSelectedKey) {
          const result = JSON.parse(localStorage.getItem(lastSelectedKey) || 'null');
          
          // If parentId is not in the result but we have it in localStorage, add it
          if (result && !result.parentId) {
            const parentId = localStorage.getItem('apilot_last_selected_request_parentId');
            if (parentId) {
              result.parentId = parseInt(parentId, 10);
            }
          }
          
          return result;
        }
        return null;
      }
    } catch (error) {
      console.error('Error retrieving selected request details:', error);
      return null;
    }
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}
