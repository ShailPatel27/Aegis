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

  // Update user profile
  updateProfile: async (token: string, profileData: {
    name?: string;
    phone?: string;
    recovery_email?: string;
    alternate_contact?: string;
    current_password?: string;
    new_password?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }
    
    return response.json();
  },

  // Send verification code
  sendVerificationCode: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send verification code');
    }
    
    return response.json();
  },

  // Verify code
  verifyCode: async (email: string, code: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to verify code');
    }
    
    return response.json();
  },

  // Reset password with code
  resetPasswordWithCode: async (email: string, code: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password-with-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset password');
    }
    
    return response.json();
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset password');
    }
    
    return response.json();
  },

  // Add recovery email
  addRecoveryEmail: async (token: string, recoveryEmail: string) => {
    console.log('API: Adding recovery email', { recoveryEmail, token: token.substring(0, 20) + '...' });
    
    const response = await fetch(`${API_BASE_URL}/auth/recovery-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ recovery_email: recoveryEmail }),
    });
    
    console.log('API: Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('API: Error response:', error);
      throw new Error(error.detail || 'Failed to add recovery email');
    }
    
    const data = await response.json();
    console.log('API: Success response:', data);
    return data;
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
