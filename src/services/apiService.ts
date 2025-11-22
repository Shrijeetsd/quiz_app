// API Service for Commerce Gate App
import { API_CONFIG } from '../constants';
import type { PaginatedResponse } from '../types';

class ApiService {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
  }

  /**
   * Get authentication token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    // This will be implemented when storage service is ready
    return null;
  }

  /**
   * Create request headers
   */
  private async createHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);

    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.makeRequest<T>(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      (error.message && error.message.includes('5'))
    );
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(url: string, includeAuth: boolean = true): Promise<T> {
    const headers = await this.createHeaders(includeAuth);
    return this.makeRequest<T>(url, {
      method: 'GET',
      headers,
    });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, includeAuth: boolean = true): Promise<T> {
    const headers = await this.createHeaders(includeAuth);
    return this.makeRequest<T>(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, includeAuth: boolean = true): Promise<T> {
    const headers = await this.createHeaders(includeAuth);
    return this.makeRequest<T>(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, includeAuth: boolean = true): Promise<T> {
    const headers = await this.createHeaders(includeAuth);
    return this.makeRequest<T>(url, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, includeAuth: boolean = true): Promise<T> {
    const headers = await this.createHeaders(includeAuth);
    return this.makeRequest<T>(url, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * Upload file
   */
  async uploadFile<T>(
    url: string,
    file: File | FormData,
    includeAuth: boolean = true,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const headers: Record<string, string> = {};
    
    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Don't set Content-Type for FormData, let the browser set it
    const formData = file instanceof FormData ? file : (() => {
      const fd = new FormData();
      fd.append('file', file);
      return fd;
    })();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText as unknown as T);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${this.baseURL}${url}`);
      xhr.timeout = this.timeout;
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value as string);
      });
      
      xhr.send(formData);
    });
  }

  /**
   * Download file
   */
  async downloadFile(
    url: string,
    filename?: string,
    includeAuth: boolean = true,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const headers = await this.createHeaders(includeAuth);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      
      xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Download failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Download failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Download timeout'));
      });

      xhr.open('GET', `${this.baseURL}${url}`);
      xhr.timeout = this.timeout;
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value as string);
      });
      
      xhr.send();
    });
  }

  /**
   * Build query string from object
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
    
    return searchParams.toString();
  }

  /**
   * GET request with query parameters
   */
  async getWithParams<T>(
    url: string,
    params: Record<string, any> = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const queryString = this.buildQueryString(params);
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.get<T>(fullUrl, includeAuth);
  }

  /**
   * Get paginated data
   */
  async getPaginated<T>(
    url: string,
    page: number = 1,
    limit: number = 20,
    params: Record<string, any> = {},
    includeAuth: boolean = true
  ): Promise<PaginatedResponse<T>> {
    const allParams = {
      page,
      limit,
      ...params,
    };
    
    return this.getWithParams<PaginatedResponse<T>>(url, allParams, includeAuth);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health', false);
  }

  /**
   * Get API version
   */
  async getVersion(): Promise<{ version: string; build: string }> {
    return this.get<{ version: string; build: string }>('/version', false);
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export class for testing or custom instances
export default ApiService;