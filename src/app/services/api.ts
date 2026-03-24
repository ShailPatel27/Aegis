const API_BASE_URL = 'http://localhost:8000';

// User authentication API calls
export const authAPI = {
  // Register new user
  register: async (userData: {
    email: string;
    name: string;
    user_type: 'camera' | 'monitor';
    password: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
    
    return response.json();
  },

  // Login user
  login: async (credentials: {
    email: string;
    password: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    return response.json();
  },

  // Get current user info
  getCurrentUser: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return response.json();
  },
};

// Token management
export const tokenManager = {
  setToken: (token: string) => {
    localStorage.setItem('aegis_token', token);
  },
  
  getToken: () => {
    return localStorage.getItem('aegis_token');
  },
  
  removeToken: () => {
    localStorage.removeItem('aegis_token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('aegis_token');
  },
};
