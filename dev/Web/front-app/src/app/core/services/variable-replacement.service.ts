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

  /**
   * Set the active environment by ID
   * @param environmentId The ID of the environment to set as active, or null to clear
   */
  setActiveEnvironment(environmentId: number | null): void {
    if (environmentId === null || environmentId === undefined || environmentId === 0) {
      this.activeEnvironmentId.next(null);
      this.environmentVariables.next({});
      return;
    }

    this.activeEnvironmentId.next(environmentId);
    this.loadEnvironmentVariables(environmentId);
  }

  /**
   * Get the current active environment ID
   */
  getActiveEnvironmentId(): Observable<number | null> {
    return this.activeEnvironmentId.asObservable();
  }

  /**
   * Get the current environment variables
   */
  getCurrentEnvironmentVariables(): Observable<{[key: string]: string}> {
    return this.environmentVariables.asObservable();
  }

  /**
   * Load environment variables from the specified environment
   * @param environmentId The environment ID to load variables from
   */
  private loadEnvironmentVariables(environmentId: number): void {
    this.environmentService.getEnvironmentById(environmentId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.environmentVariables.next(response.data.variables || {});
        } else {
          console.error('Failed to load environment variables:', response.error);
          this.environmentVariables.next({});
        }
      },
      error: (error) => {
        console.error('Error loading environment variables:', error);
        this.environmentVariables.next({});
      }
    });
  }

  /**
   * Replace variables in a string with their values
   * Format: {{variableName}}
   * @param input The input string containing variables to replace
   * @param isUrl Optional flag to indicate if the input is a URL (defaults to false)
   * @returns The string with variables replaced by their values
   */
  replaceVariables(input: string, isUrl: boolean = false): string {
    if (!input) return input;

    const variables = this.environmentVariables.getValue();
    const variableRegex = /\{\{([^{}]+)\}\}/g;
    
    return input.replace(variableRegex, (match, variableName) => {
      const trimmedName = variableName.trim();
      let value = variables[trimmedName] !== undefined ? variables[trimmedName] : match;
      
      // If we're dealing with a URL and the value starts with http:// or https://,
      // but is used within a larger URL, we should strip the protocol prefix
      if (isUrl && value !== match) {
        // Only strip if it's not the beginning of the URL - to allow for protocol variables
        const matchIndex = input.indexOf(match);
        const isStartOfString = matchIndex === 0 || input.substring(0, matchIndex).trim() === '';
        
        if (!isStartOfString && (value.startsWith('http://') || value.startsWith('https://'))) {
          try {
            const urlObj = new URL(value);
            // Just use the hostname + pathname + search + hash
            value = urlObj.host + urlObj.pathname + urlObj.search + urlObj.hash;
          } catch (e) {
            // If URL parsing fails, just use the value as is
          }
        }
      }
      
      return value;
    });
  }

  /**
   * Replace variables in an object's string properties
   * @param obj The object containing string properties with variables
   * @returns A new object with variables replaced in string properties
   */
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
  
  /**
   * Detect variables in a string (for highlighting)
   * @param input The input string to analyze
   * @returns Array of detected variables
   */
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

  /**
   * Check if a variable is defined in the current environment
   * @param variableName The name of the variable to check
   * @returns True if the variable is defined, false otherwise
   */
  isVariableDefined(variableName: string): boolean {
    const variables = this.environmentVariables.getValue();
    return variables[variableName] !== undefined;
  }
}
