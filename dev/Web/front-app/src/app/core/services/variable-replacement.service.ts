import { Injectable } from '@angular/core';
import { EnvironmentService } from './environment.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VariableReplacementService {
  private activeEnvironmentId = new BehaviorSubject<number | null>(null);
  private environmentVariables = new BehaviorSubject<{[key: string]: string}>({});

  constructor(private environmentService: EnvironmentService) {}

  setActiveEnvironment(environmentId: number | null): void {
    if (environmentId === null || environmentId === undefined || environmentId === 0) {
      this.activeEnvironmentId.next(null);
      this.environmentVariables.next({});
      return;
    }

    this.activeEnvironmentId.next(environmentId);
    this.loadEnvironmentVariables(environmentId);
  }

  getActiveEnvironmentId(): Observable<number | null> {
    return this.activeEnvironmentId.asObservable();
  }

  getCurrentEnvironmentVariables(): Observable<{[key: string]: string}> {
    return this.environmentVariables.asObservable();
  }

  private loadEnvironmentVariables(environmentId: number): void {
    this.environmentService.getEnvironmentById(environmentId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.environmentVariables.next(response.data.variables || {});
        } else {
          this.environmentVariables.next({});
        }
      },
      error: (error) => {
        this.environmentVariables.next({});
      }
    });
  }

  replaceVariables(input: string, isUrl: boolean = false): string {
    if (!input) return input;

    const variables = this.environmentVariables.getValue();
    const variableRegex = /\{\{([^{}]+)\}\}/g;
    
    return input.replace(variableRegex, (match, variableName) => {
      const trimmedName = variableName.trim();
      let value = variables[trimmedName] !== undefined ? variables[trimmedName] : match;
      
      if (isUrl && value !== match) {
        const matchIndex = input.indexOf(match);
        const isStartOfString = matchIndex === 0 || input.substring(0, matchIndex).trim() === '';
        
        if (!isStartOfString && (value.startsWith('http://') || value.startsWith('https://'))) {
          try {
            const urlObj = new URL(value);
            value = urlObj.host + urlObj.pathname + urlObj.search + urlObj.hash;
          } catch (e) {
          }
        }
      }
      
      return value;
    });
  }

  replaceVariablesInObject(obj: any): any {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      return this.replaceVariables(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariablesInObject(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = this.replaceVariablesInObject(obj[key]);
        }
      }
      return result;
    }
    
    return obj;
  }
  
  detectVariables(input: string): string[] {
    if (!input) return [];
    
    const variables = this.environmentVariables.getValue();
    const variableRegex = /\{\{([^{}]+)\}\}/g;
    const detectedVariables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(input)) !== null) {
      const variableName = match[1].trim();
      detectedVariables.push(variableName);
    }
    
    return detectedVariables;
  }

  isVariableDefined(variableName: string): boolean {
    const variables = this.environmentVariables.getValue();
    return variables[variableName] !== undefined;
  }
}
