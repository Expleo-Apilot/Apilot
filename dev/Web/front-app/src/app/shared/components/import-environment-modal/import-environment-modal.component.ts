import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EnvironmentService } from '../../../core/services/environment.service';
import { ImportEnvironmentsRequest, ImportEnvironmentData } from '../../../core/models/environment.model';

interface ImportPreviewData {
  environments: Array<{
    name: string;
    variables: { [key: string]: string };
    id?: number;
  }>;
  exportedAt?: string;
  exportedBy?: string;
  workspaceId?: number;
}

interface ImportEnvironmentModalData {
  workspaceId: number;
}

@Component({
  selector: 'app-import-environment-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './import-environment-modal.component.html',
  styleUrls: ['./import-environment-modal.component.css']
})
export class ImportEnvironmentModalComponent implements OnInit {
  selectedFile: File | null = null;
  previewData: ImportPreviewData | null = null;
  isLoading = false;
  errorMessage = '';
  currentStep: 'file-selection' | 'preview' = 'file-selection';
  editableEnvironmentNames: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ImportEnvironmentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportEnvironmentModalData,
    private environmentService: EnvironmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      this.selectedFile = file;
      this.parseFile();
    } else {
      this.errorMessage = 'Please select a valid JSON file.';
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        this.selectedFile = file;
        this.parseFile();
      } else {
        this.errorMessage = 'Please select a valid JSON file.';
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  private parseFile(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Normalize the data to handle both single environment and list formats
        const normalizedData = this.normalizeImportData(data);
        
        // Validate the structure
        if (this.isValidImportData(normalizedData)) {
          this.previewData = normalizedData;
          this.editableEnvironmentNames = normalizedData.environments.map((env: any) => env.name);
          this.currentStep = 'preview';
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Invalid file format. Please select a valid environment export file.';
        }
      } catch (error) {
        this.errorMessage = 'Failed to parse JSON file. Please check the file format.';
      }
    };
    reader.readAsText(this.selectedFile);
  }

  private normalizeImportData(data: any): any {
    // Handle single environment format
    if (data.name && data.variables && !data.environments) {
      return {
        environments: [{
          name: data.name,
          variables: data.variables
        }],
        exportedAt: data.exportedAt || new Date().toISOString(),
        exportedBy: data.exportedBy || 'Unknown'
      };
    }
    
    // Handle list format (already normalized)
    if (data.environments && Array.isArray(data.environments)) {
      return data;
    }
    
    // Handle array of environments at root level
    if (Array.isArray(data)) {
      return {
        environments: data,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Unknown'
      };
    }
    
    return data;
  }

  private isValidImportData(data: any): boolean {
    if (!data) return false;
    
    // Check if it has environments array
    if (Array.isArray(data.environments)) {
      return data.environments.every((env: any) => 
        env.name && 
        typeof env.name === 'string' && 
        env.variables && 
        typeof env.variables === 'object'
      );
    }
    
    return false;
  }

  changeFile(): void {
    this.selectedFile = null;
    this.previewData = null;
    this.currentStep = 'file-selection';
    this.errorMessage = '';
    this.editableEnvironmentNames = [];
  }

  updateEnvironmentName(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.editableEnvironmentNames[index] = target.value;
  }

  getVariableEntries(variables: { [key: string]: string }): Array<{key: string, value: string}> {
    return Object.entries(variables).map(([key, value]) => ({ key, value }));
  }

  async importEnvironments(): Promise<void> {
    if (!this.previewData || !this.selectedFile) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (!this.previewData) {
        this.errorMessage = 'No preview data available';
        return;
      }

      // Prepare the import data with updated names
      const importData: ImportEnvironmentsRequest = {
        workspaceId: this.data.workspaceId,
        environments: this.previewData.environments.map((env: any, index: number) => ({
          name: this.editableEnvironmentNames[index] || env.name,
          variables: env.variables
        })),
        exportedAt: this.previewData.exportedAt,
        exportedBy: this.previewData.exportedBy
      };

      const result = await this.environmentService.importEnvironments(importData).toPromise();
      
      if (result?.isSuccess) {
        this.snackBar.open(`Successfully imported ${importData.environments.length} environment(s)`, 'Close', {
          duration: 3000
        });
        this.dialogRef.close({ success: true, importedCount: importData.environments.length });
      } else {
        this.errorMessage = result?.error || 'Failed to import environments';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred while importing environments';
    } finally {
      this.isLoading = false;
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
