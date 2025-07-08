import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { PrismService } from '../../../services/prism.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    'pre-request': `const baseUrl = "http://localhost:5051";
request.headers.set('Content-Type', 'application/json');`,

    'test': `Test("Status code is 200", () => {
  Assert(response.status === 200);
});

Test("Response is JSON", () => {
  Assert(response.headers.get('content-type')?.includes('application/json'));
});

Test("Response has required fields", () => {
  const body = response.json();
  Assert(body.id);
  Assert(body.name);
});`
  };

  constructor(private prism: PrismService, private snackBar: MatSnackBar) {}

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
    this.snackBar.open('Example script loaded', 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
  
  clearScript(): void {
    this.scriptContent = '';
    this.scriptChanged.emit(this.scriptContent);
    this.prism.highlightElement(this.editorRef.nativeElement);
  }
}
