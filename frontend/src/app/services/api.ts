export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `http://${window.location.hostname}:8000`;

const API_BASE_URL = `${BACKEND_BASE_URL}/api/v1`;
const CAMERA_API_URL = `${BACKEND_BASE_URL}/api/cameras`;

// fetch(`${CAMERA_API_URL}`)

// User authentication API calls
export const authAPI = {
  // Register new user
  register: async (userData: {
    email: string;
    name: string;
    password: string;
  }) => {

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result?.message ||
        result?.detail ||
        "Registration failed"
      );
    }

    return result.data;
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

    const result = await response.json();
    // Handle new API structure: {success: true, data: {...}}
    return result.success ? result.data : result;
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

  // Refresh token
  refreshToken: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Refresh failed');
    const result = await response.json();
    return result.token;
  },
};

// Camera API calls
export const cameraAPI = {
  getCameras: async (token: string | null) => {

    if (!token) return [];

    const response = await fetch(`${CAMERA_API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  },

  registerCamera: async (token: string, cameraData: {
    name: string;
    selected_camera: number;
    type?: string;
    location?: string;
  }) => {
    const response = await fetch(`${CAMERA_API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cameraData),
    });

    if (!response.ok) {
      throw new Error("Failed to register camera");
    }

    return response.json();
  },

  deleteCamera: async (token: string, cameraId: string) => {
    const response = await fetch(`${CAMERA_API_URL}/${cameraId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete camera");
    }

    return response.json();
  }
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
