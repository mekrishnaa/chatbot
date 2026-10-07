import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container">
      <div
        class="dropzone"
        [class.dragging]="isDragging()"
        [class.uploading]="documentService.uploading()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          accept=".txt,.pdf,.docx,.md,.csv"
          (change)="onFileSelected($event)"
          style="display: none;"
        />

        @if (documentService.uploading()) {
          <div class="upload-status">
            <span class="upload-spinner"></span>
            <span class="upload-text">Extracting text & generating embeddings...</span>
          </div>
        } @else {
          <div class="drop-content">
            <span class="upload-icon">📤</span>
            <button type="button" class="upload-btn">
              [ Upload Document ]
            </button>
            <span class="drop-hint">Supports TXT, PDF, DOCX (up to 15MB)</span>
          </div>
        }
      </div>

      <button
        type="button"
        class="sample-data-btn"
        (click)="uploadSampleHandbook()"
        [disabled]="documentService.uploading()"
      >
        <span>📑 Load Sample Employee Handbook</span>
      </button>
    </div>
  `,
  styles: [`
    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .dropzone {
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.1rem 0.85rem;
      text-align: center;
      cursor: pointer;
      background: rgba(15, 23, 42, 0.4);
      transition: all 0.2s ease;
    }
    .dropzone:hover {
      border-color: var(--accent-blue);
      background: rgba(59, 130, 246, 0.05);
    }
    .dropzone.dragging {
      border-color: var(--accent-blue);
      background: rgba(59, 130, 246, 0.1);
    }
    .dropzone.uploading {
      pointer-events: none;
      opacity: 0.85;
      border-color: var(--accent-blue);
    }
    .drop-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
    }
    .upload-icon {
      font-size: 1.35rem;
    }
    .upload-btn {
      background: var(--accent-blue);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.45rem 0.95rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      pointer-events: none; /* click goes through to dropzone */
    }
    .drop-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .upload-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
    .upload-spinner {
      width: 22px;
      height: 22px;
      border: 2.5px solid rgba(59, 130, 246, 0.2);
      border-top-color: var(--accent-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .upload-text {
      font-size: 0.78rem;
      color: #93c5fd;
      font-weight: 500;
    }
    .sample-data-btn {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--border-color);
      color: #93c5fd;
      font-size: 0.8rem;
      font-weight: 500;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
    }
    .sample-data-btn:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
    }
    .sample-data-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class DocumentUploadComponent {
  documentService = inject(DocumentService);
  isDragging = signal(false);

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.uploadFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
      input.value = ''; // Reset input
    }
  }

  private async uploadFile(file: File): Promise<void> {
    try {
      await this.documentService.uploadDocument(file);
    } catch {}
  }

  async uploadSampleHandbook(): Promise<void> {
    const sampleContent = `Employee Handbook

Annual Leave

Employees are entitled to 24 paid leave days per calendar year.

Leave requests should be submitted through the employee portal and
must be approved by the employee's manager.

Unused leave may be carried forward for up to 5 days into the following
calendar year.

Sick Leave

Employees are entitled to 10 sick leave days per calendar year.

Remote Work

Employees may work remotely up to 3 days per week with manager approval.

Working Hours

Standard working hours are 9:00 AM to 6:00 PM, Monday through Friday.`;

    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const file = new File([blob], 'employee-handbook.txt', {
      type: 'text/plain',
    });

    try {
      await this.documentService.uploadDocument(file);
    } catch {}
  }
}

