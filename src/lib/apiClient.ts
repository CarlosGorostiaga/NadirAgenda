const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
  };
}

interface AccessResponse {
  access: {
    plan: string;
    access_until: string;
    has_access: boolean;
    days_remaining: number;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Cargar token del localStorage al iniciar
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Registrar usuario
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar');
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  // Login
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  // Obtener usuario actual
  async getUser() {
    if (!this.token) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      this.logout();
      return null;
    }

    const data = await response.json();
    return data.user;
  }

  // Obtener acceso del usuario
  async getAccess(): Promise<AccessResponse['access'] | null> {
    if (!this.token) return null;

    const response = await fetch(`${API_URL}/user/access`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      return null;
    }

    const data: AccessResponse = await response.json();
    return data.access;
  }

  // Logout
  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiClient = new ApiClient();
