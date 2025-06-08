import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';

// Monaco editor options interface
interface EditorOptions {
  theme: string;
  language: string;
  automaticLayout: boolean;
  minimap: { enabled: boolean };
  scrollBeyondLastLine: boolean;
  fontSize: number;
  tabSize: number;
  wordWrap: string;
}

// Test result interface
interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration?: number;
}

@Component({
  selector: 'app-tools-panel',
  standalone: false,
  templateUrl: './tools-panel.component.html',
  styleUrl: './tools-panel.component.css'
})
export class ToolsPanelComponent implements OnInit {
  // Editor configuration
  editorOptions: EditorOptions = {
    theme: 'vs',
    language: 'javascript',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on'
  };

  // Test script code
  testScript: string = '';
  
  // Test results
  testResults: TestResult[] = [];
  isRunning: boolean = false;
  hasRun: boolean = false;
  allTestsPassed: boolean = true;
  totalTests: number = 0;
  passedTests: number = 0;
  
  // Selected tab
  activeTab: 'script' | 'results' = 'script';

  constructor() { }

  ngOnInit(): void {
    // Initialize with a sample test script
    this.testScript = this.getSampleTestScript();
  }

  /**
   * Run the test script
   */
  runTests(): void {
    this.isRunning = true;
    this.hasRun = true;
    this.testResults = [];
    
    // Simulate test execution delay
    setTimeout(() => {
      try {
        // In a real implementation, this would execute the test script against the actual response
        // For now, we'll simulate some test results
        this.testResults = this.simulateTestResults();
        
        // Calculate test statistics
        this.totalTests = this.testResults.length;
        this.passedTests = this.testResults.filter(test => test.passed).length;
        this.allTestsPassed = this.passedTests === this.totalTests;
        
        // Switch to results tab
        this.activeTab = 'results';
      } catch (error) {
        // Handle script execution errors
        this.testResults = [{
          name: 'Script Error',
          passed: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }];
        this.totalTests = 1;
        this.passedTests = 0;
        this.allTestsPassed = false;
      } finally {
        this.isRunning = false;
      }
    }, 500);
  }

  /**
   * Switch between script and results tabs
   */
  switchTab(tab: 'script' | 'results'): void {
    this.activeTab = tab;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.testResults = [];
    this.hasRun = false;
    this.totalTests = 0;
    this.passedTests = 0;
  }

  /**
   * Simulate test results for demonstration
   */
  private simulateTestResults(): TestResult[] {
    // This is just for demonstration - in a real implementation,
    // we would actually execute the test script against the response
    return [
      {
        name: 'Status code is 200',
        passed: true,
        duration: 5
      },
      {
        name: 'Response time is less than 200ms',
        passed: true,
        duration: 3
      },
      {
        name: 'Response has valid JSON format',
        passed: true,
        duration: 2
      },
      {
        name: 'Response contains user data',
        passed: false,
        message: 'Expected property "user" to exist in response',
        duration: 4
      },
      {
        name: 'Authentication token is present',
        passed: true,
        duration: 1
      }
    ];
  }

  /**
   * Get a sample test script for demonstration
   */
  private getSampleTestScript(): string {
    return `// Example test script
// Similar to Postman tests
pm.test("Status code is 200", function() {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 200ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(200);
});

pm.test("Response has valid JSON format", function() {
    pm.response.to.be.json;
});

pm.test("Response contains user data", function() {
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.have.property('user');
});

pm.test("Authentication token is present", function() {
    const responseJson = pm.response.json();
    pm.expect(responseJson.token).to.exist;
});`;
  }
}
