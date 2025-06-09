import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { LlmFactoryService, LlmType } from '../../core/services/llm-factory.service';
import { LlmService } from '../../core/services/llm.service';
import { TestRunnerService, TestResult, TestResponse } from '../../core/services/test-runner.service';
import { NgIf } from '@angular/common';
import { catchError, finalize, of } from 'rxjs';

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

// TestResult interface is now imported from test-runner.service.ts

@Component({
  selector: 'app-tools-panel',
  standalone: false,
  templateUrl: './tools-panel.component.html',
  styleUrl: './tools-panel.component.css'
})
export class ToolsPanelComponent implements OnInit {
  // Editor configuration
  editorOptions: EditorOptions = {
    theme: 'vs-light',
    language: 'csharp',
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

  // Prompt input
  promptInput: string = '';
  isProcessingPrompt: boolean = false;
  promptHistory: string[] = [];
  currentHistoryIndex: number = -1;
  errorMessage: string = '';

  // LLM selection
  availableLlmTypes: LlmType[] = [];
  selectedLlmType: LlmType = LlmType.OLLAMA;
  currentModelName: string = '';

  // Real-time typing effect
  private typingInterval: any;
  private typingSpeed: number = 10; // ms per character
  private currentTypingText: string = '';
  private targetTypingText: string = '';
  private typingPosition: number = 0;
  private typingPrompt: string = '';

  constructor(private llmFactoryService: LlmFactoryService, private testRunnerService: TestRunnerService) { }

  ngOnInit(): void {
    // Initialize with a sample test script
    this.testScript = this.getSampleTestScript();

    // Load prompt history from localStorage if available
    this.loadPromptHistory();

    // Initialize LLM types and selection
    this.availableLlmTypes = this.llmFactoryService.getAllLlmTypes();
    this.selectedLlmType = this.llmFactoryService.getCurrentLlmType();
    this.updateCurrentModelName();
  }

  /**
   * Run the test script
   */
  runTests(): void {
    if (!this.testScript || this.testScript.trim() === '') {
      this.errorMessage = 'Please enter a test script before running tests.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isRunning = true;
    this.hasRun = true;
    this.testResults = [];
    this.errorMessage = '';

    this.testRunnerService.runTests(this.testScript).subscribe(
      (response: TestResponse) => {
        if (response.success) {
          this.testResults = response.results;
          this.totalTests = response.totalTests;
          this.passedTests = response.passedTests;
          this.allTestsPassed = this.passedTests === this.totalTests;
        } else {
          // Handle server-side error with the test execution
          this.testResults = [{
            name: 'Test Execution Error',
            passed: false,
            message: response.errorMessage || 'The server encountered an error while executing tests',
            duration: 0
          }];
          this.totalTests = 1;
          this.passedTests = 0;
          this.allTestsPassed = false;
        }
        this.activeTab = 'results';
      },
      (error) => {
        console.error('Error running tests:', error);

        // Determine if it's a connection error or other HTTP error
        let errorMessage = 'Failed to run tests';

        if (error.status === 0) {
          errorMessage = 'Cannot connect to the test runner service. Please make sure the backend API is running.';
        } else if (error.status >= 400) {
          errorMessage = `Server error (${error.status}): ${error.error?.message || error.statusText || 'Unknown error'}`;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.testResults = [{
          name: 'Test Runner Error',
          passed: false,
          message: errorMessage,
          duration: 0
        }];
        this.totalTests = 1;
        this.passedTests = 0;
        this.allTestsPassed = false;
        this.activeTab = 'results';
      },
      () => {
        this.isRunning = false;
      }
    );
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
   * Get a sample test script for demonstration
   */
  private getSampleTestScript(): string {
    return `Test("Simple Math Test", () => {
  // A simple test that performs basic math
  int result = 2 + 2;
  Assert(result == 4, "2 + 2 should equal 4");
  return true;
});

Test("String Test", () => {
  // A simple test that checks string operations
  string test = "Hello" + " " + "World";
  Assert(test == "Hello World", "String concatenation should work correctly");
  return true;
});`;
  }

  /**
   * Process the prompt input and generate code using selected LLM
   */
  processPrompt(): void {
    if (!this.promptInput.trim()) return;

    this.isProcessingPrompt = true;
    this.errorMessage = '';
    const prompt = this.promptInput.trim();
    this.typingPrompt = prompt;

    // Add to history
    this.addToPromptHistory(prompt);

    // Clear input field
    this.promptInput = '';

    // Stop any ongoing typing animation
    this.stopTypingAnimation();

    // Get the current LLM service
    const llmService = this.llmFactoryService.getCurrentLlm();

    // Call the LLM service to generate test code
    llmService.generateTestCode(prompt)
      .pipe(
        catchError(error => {
          console.error(`Error calling ${llmService.getModelName()} API:`, error);
          this.errorMessage = `Error: ${error.message || `Failed to connect to ${llmService.getModelName()}. Please check your connection.`}`;
          return of(null);
        }),
        finalize(() => {
          this.isProcessingPrompt = false;
        })
      )
      .subscribe(response => {
        if (response) {
          // Extract and clean the generated code
          const generatedCode = this.cleanGeneratedCode(response.response);

          // Prepare the text to be typed
          let newContent = '';
          if (this.testScript && this.testScript.trim()) {
            // Append to existing code with a separator
            newContent = this.testScript + '\n\n// Generated from prompt: "' + prompt + '" using ' + llmService.getModelName() + '\n' + generatedCode;
          } else {
            // Set as new code
            newContent = '// Generated from prompt: "' + prompt + '" using ' + llmService.getModelName() + '\n' + generatedCode;
          }

          // Start the typing animation
          this.startTypingAnimation(newContent);
        }
      });
  }

  /**
   * Handle key events in the prompt input
   */
  handlePromptKeyEvent(event: KeyboardEvent): void {
    // Handle Enter key to submit
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.processPrompt();
    }

    // Handle Up arrow for history navigation
    if (event.key === 'ArrowUp') {
      if (this.currentHistoryIndex < this.promptHistory.length - 1) {
        this.currentHistoryIndex++;
        this.promptInput = this.promptHistory[this.promptHistory.length - 1 - this.currentHistoryIndex];
        event.preventDefault();
      }
    }

    // Handle Down arrow for history navigation
    if (event.key === 'ArrowDown') {
      if (this.currentHistoryIndex > 0) {
        this.currentHistoryIndex--;
        this.promptInput = this.promptHistory[this.promptHistory.length - 1 - this.currentHistoryIndex];
        event.preventDefault();
      } else if (this.currentHistoryIndex === 0) {
        this.currentHistoryIndex = -1;
        this.promptInput = '';
        event.preventDefault();
      }
    }
  }

  /**
   * Add a prompt to the history
   */
  private addToPromptHistory(prompt: string): void {
    // Add to the beginning of the array
    this.promptHistory.push(prompt);

    // Limit history size
    if (this.promptHistory.length > 20) {
      this.promptHistory.shift();
    }

    // Reset current index
    this.currentHistoryIndex = -1;

    // Save to localStorage
    this.savePromptHistory();
  }

  /**
   * Save prompt history to localStorage
   */
  private savePromptHistory(): void {
    try {
      localStorage.setItem('promptHistory', JSON.stringify(this.promptHistory));
    } catch (error) {
      console.error('Error saving prompt history:', error);
    }
  }

  /**
   * Load prompt history from localStorage
   */
  private loadPromptHistory(): void {
    try {
      const history = localStorage.getItem('promptHistory');
      if (history) {
        this.promptHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Error loading prompt history:', error);
    }
  }

  /**
   * Start the typing animation effect
   * @param targetText The complete text that should be displayed when animation completes
   */
  private startTypingAnimation(targetText: string): void {
    // Store the current and target text
    this.currentTypingText = this.testScript;
    this.targetTypingText = targetText;
    this.typingPosition = this.currentTypingText.length;

    // Start the interval to add characters one by one
    this.typingInterval = setInterval(() => this.typeNextCharacter(), this.typingSpeed);
  }

  /**
   * Type the next character in the animation sequence
   */
  private typeNextCharacter(): void {
    // Check if we've reached the end of the target text
    if (this.typingPosition >= this.targetTypingText.length) {
      this.stopTypingAnimation();
      return;
    }

    // Add the next character
    this.typingPosition++;
    this.testScript = this.targetTypingText.substring(0, this.typingPosition);
  }

  /**
   * Stop the typing animation
   */
  private stopTypingAnimation(): void {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;

      // Ensure the full text is displayed
      if (this.targetTypingText) {
        this.testScript = this.targetTypingText;
      }
    }
  }

  /**
   * Change the selected LLM type
   * @param llmType The LLM type to switch to
   */
  changeLlmType(llmType: LlmType): void {
    this.selectedLlmType = llmType;
    this.llmFactoryService.setCurrentLlmType(llmType);
    this.updateCurrentModelName();
  }

  /**
   * Update the current model name display
   */
  private updateCurrentModelName(): void {
    const currentLlm = this.llmFactoryService.getCurrentLlm();
    this.currentModelName = currentLlm.getModelName();
  }

  private cleanGeneratedCode(response: string): string {
    // Try to extract code blocks if they exist (markdown format ```js...```)
    const codeBlockRegex = /```(?:javascript|js)?([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      // Add the content inside the code block
      codeBlocks.push(match[1].trim());
    }

    // If we found code blocks, join them
    if (codeBlocks.length > 0) {
      return codeBlocks.join('\n\n');
    }

    // If no code blocks, try to clean up the response as best as possible
    // Remove any explanatory text before or after the code
    let cleanedCode = response;

    // Remove common prefixes that LLMs might add
    const prefixesToRemove = [
      'Here is the code:',
      'Here\'s the code:',
      'Here is a test script:',
      'Here\'s a test script:',
      'Here is the test code:',
      'Here\'s the test code:'
    ];

    for (const prefix of prefixesToRemove) {
      if (cleanedCode.includes(prefix)) {
        cleanedCode = cleanedCode.substring(cleanedCode.indexOf(prefix) + prefix.length).trim();
      }
    }

    // Look for pm.test patterns to identify the actual code
    if (cleanedCode.includes('pm.test(')) {
      // Find the first occurrence of pm.test
      const firstTestIndex = cleanedCode.indexOf('pm.test(');
      if (firstTestIndex > 0) {
        cleanedCode = cleanedCode.substring(firstTestIndex);
      }

      // Try to find where the code ends (if there's explanatory text after)
      const possibleEndMarkers = ['Note:', 'This code', 'These tests', 'The above', 'This test'];
      for (const marker of possibleEndMarkers) {
        const markerIndex = cleanedCode.indexOf(marker);
        if (markerIndex > 0 && markerIndex > cleanedCode.lastIndexOf('});')) {
          cleanedCode = cleanedCode.substring(0, markerIndex).trim();
          break;
        }
      }
    }

    return cleanedCode;
  }
}
