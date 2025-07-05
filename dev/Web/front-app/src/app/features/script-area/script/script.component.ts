import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { PrismService } from '../../../services/prism.service';

/**
 * Script Component for API test scripts
 *
 * Features:
 * - Syntax highlighting via Prism.js
 * - Pre-request and test script support
 * - Example scripts
 * - Real-time change detection
 *
 * Usage:
 * <app-script
 *   [scriptType]="'pre-request' | 'test'"
 *   (scriptChanged)="onScriptChange($event)">
 * </app-script>
 */
@Component({
  selector: 'app-script',
  templateUrl: './script.component.html',
  styleUrls: ['./script.component.css']
})
export class ScriptComponent implements AfterViewInit {
  @Input() scriptType!: 'pre-request' | 'test';
  @Output() scriptChanged = new EventEmitter<string>();
  @ViewChild('editor') editorRef!: ElementRef;

  scriptContent = '';

  readonly examples = {
    'pre-request': `// Set environment variables
pm.environment.set('api_key', '12345');

// Add headers
pm.request.headers.add({
  key: 'Authorization',
  value: 'Bearer ' + pm.environment.get('token')
});`,

    'test': `// Basic test example
pm.test('Status code is 200', () => {
  pm.expect(pm.response.code).to.equal(200);
});

// Response time test
pm.test('Response time is less than 200ms', () => {
  pm.expect(pm.response.responseTime).to.be.below(200);
});`
  };

  constructor(private prism: PrismService) {}

  ngAfterViewInit(): void {
    this.prism.highlightElement(this.editorRef.nativeElement);
  }

  onScriptChange(content: string): void {
    this.scriptContent = content;
    this.scriptChanged.emit(content);
    this.prism.highlightElement(this.editorRef.nativeElement);
  }

  loadExample(): void {
    this.scriptContent = this.examples[this.scriptType];
    this.scriptChanged.emit(this.scriptContent);
    this.prism.highlightElement(this.editorRef.nativeElement);
  }
}
