import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DocumentDto } from '@org-ai/shared';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly apiUrl = '/api/documents';
  private readonly http = inject(HttpClient);

  readonly documents = signal<DocumentDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly uploading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<DocumentDto[]>(this.apiUrl).subscribe({
      next: (docs: DocumentDto[]) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: (err: any) => {
        const msg = err.error?.message || err.message || 'Failed to load documents';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  uploadDocument(file: File): Promise<DocumentDto> {
    this.uploading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('file', file, file.name);

    return new Promise((resolve, reject) => {
      this.http.post<DocumentDto>(`${this.apiUrl}/upload`, formData).subscribe({
        next: (doc: DocumentDto) => {
          this.uploading.set(false);
          this.loadDocuments(); // Refresh list
          resolve(doc);
        },
        error: (err: any) => {
          this.uploading.set(false);
          const msg =
            err.error?.message || err.message || 'Document upload/indexing failed';
          this.error.set(msg);
          reject(err);
        },
      });
    });
  }

  deleteDocument(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          this.documents.update((docs: DocumentDto[]) => docs.filter((d) => d.id !== id));
          resolve();
        },
        error: (err: any) => {
          const msg =
            err.error?.message || err.message || 'Failed to delete document';
          this.error.set(msg);
          reject(err);
        },
      });
    });
  }
}

