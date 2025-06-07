import DOMPurify from 'dompurify';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    aiEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

class AuthService {
  private baseUrl = import.meta.env.VITE_API_URL || '/api';

  // Sign in with Google
  async signInWithGoogle(code: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Authentication failed', success: false };
      }

      // Store token
      localStorage.setItem('token', data.token);
      
      return { data, success: true };
    } catch (error) {
      return { error: 'Authentication failed', success: false };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/signout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (error) {
      // Sign out error
    } finally {
      localStorage.removeItem('token');
      window.location.reload();
    }
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
        }
        return { error: data.error || 'Verification failed', success: false };
      }

      return { data: data.user, success: true };
    } catch (error) {
      return { error: 'Failed to get user', success: false };
    }
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<User['preferences']> & { apiKey?: string }): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/preferences`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to update preferences', success: false };
      }

      return { success: true };
    } catch (error) {
      return { error: 'Failed to update preferences', success: false };
    }
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Clear token
  clearToken(): void {
    localStorage.removeItem('token');
  }

  // Get auth headers
  private getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
