import DOMPurify from 'dompurify';
import debounce from 'lodash.debounce';
import { Thought } from '../types';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ThoughtService {
  private baseUrl = import.meta.env.VITE_API_URL || '/api';
  private operationQueue = Promise.resolve();

  // Sanitize input
  private sanitizeInput(content: string): string {
    const trimmed = content.trim();
    if (trimmed.length > 10000) {
      throw new Error('Thought content too long (max 10,000 characters)');
    }
    return DOMPurify.sanitize(trimmed);
  }

  // Queue operations to prevent race conditions
  private async queuedOperation<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation);
    this.operationQueue = result.then(() => {});
    return result;
  }

  // Get auth headers
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Generic API call helper
  private async apiCall<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.reload();
          throw new Error('Session expired');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data: data.data || data, success: true };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }

  // Add thought
  async addThought(content: string, category = 'idea'): Promise<ApiResponse<Thought>> {
    return this.queuedOperation(async () => {
      try {
        const sanitizedContent = this.sanitizeInput(content);
        if (!sanitizedContent) {
          return { error: 'Thought content cannot be empty', success: false };
        }

        return this.apiCall<Thought>(`${this.baseUrl}/thoughts`, {
          method: 'POST',
          body: JSON.stringify({ content: sanitizedContent, category }),
        });
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to add thought', 
          success: false 
        };
      }
    });
  }

  // Get thoughts with pagination and filters
  async getThoughts(
    page = 1, 
    limit = 50, 
    category?: string, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse<Thought>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category) params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());

    return this.apiCall<PaginatedResponse<Thought>>(
      `${this.baseUrl}/thoughts?${params.toString()}`
    );
  }

  // Update thought
  async updateThought(id: string, updates: Partial<Thought>): Promise<ApiResponse<Thought>> {
    return this.queuedOperation(async () => {
      try {
        if (updates.content) {
          updates.content = this.sanitizeInput(updates.content);
        }
        
        return this.apiCall<Thought>(`${this.baseUrl}/thoughts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to update thought', 
          success: false 
        };
      }
    });
  }

  // Delete thought
  async deleteThought(id: string): Promise<ApiResponse<void>> {
    return this.queuedOperation(async () => {
      return this.apiCall<void>(`${this.baseUrl}/thoughts/${id}`, {
        method: 'DELETE',
      });
    });
  }

  // Export data
  async exportData(): Promise<void> {
    try {
      const response = await this.apiCall<any>(`${this.baseUrl}/thoughts/export`);
      
      if (response.success && response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thoughts-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error || 'Export failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // Import data
  async importData(data: any): Promise<ApiResponse<{ imported: number; skipped: number }>> {
    return this.apiCall<{ imported: number; skipped: number }>(`${this.baseUrl}/thoughts/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get user statistics
  async getStats(): Promise<ApiResponse<any>> {
    return this.apiCall<any>(`${this.baseUrl}/thoughts/stats`);
  }

  // Debounced search
  debouncedSearch = debounce(
    async (query: string, callback: (results: Thought[]) => void) => {
      if (!query.trim()) {
        callback([]);
        return;
      }

      const response = await this.getThoughts(1, 20, undefined, query);
      if (response.success && response.data) {
        callback(response.data.data);
      } else {
        callback([]);
      }
    },
    300
  );
}

export const thoughtService = new ThoughtService();
