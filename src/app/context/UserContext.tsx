import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { authAPI, tokenManager } from "../services/api";

interface User {
  cameraId?: string;
  name: string;
  email: string;
  id: string;
  type?: string;
  phone?: string;
  recovery_email?: string;
  alternate_contact?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    user_type: 'camera' | 'monitor';
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("aegis_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token and validate user
    const token = tokenManager.getToken();
    if (token && !user) {
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      setIsLoading(true);
      const userData = await authAPI.getCurrentUser(token);
      const userObj: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        cameraId: userData.camera_id,
        phone: userData.phone,
        recovery_email: userData.recovery_email,
        alternate_contact: userData.alternate_contact,
      };
      setUser(userObj);
      localStorage.setItem("aegis_user", JSON.stringify(userObj));
    } catch (error) {
      console.error("Token validation failed:", error);
      tokenManager.removeToken();
      localStorage.removeItem("aegis_user");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login({ email, password });
      tokenManager.setToken(response.access_token);
      
      // Get user info
      const userData = await authAPI.getCurrentUser(response.access_token);
      const userObj: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        cameraId: userData.camera_id,
        phone: userData.phone,
        recovery_email: userData.recovery_email,
        alternate_contact: userData.alternate_contact,
      };
      
      setUser(userObj);
      localStorage.setItem("aegis_user", JSON.stringify(userObj));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    user_type: 'camera' | 'monitor';
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      tokenManager.setToken(response.access_token);
      
      // Get user info
      const userInfo = await authAPI.getCurrentUser(response.access_token);
      const userObj: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        type: userInfo.user_type,
        cameraId: userInfo.camera_id,
        phone: userInfo.phone,
        recovery_email: userInfo.recovery_email,
        alternate_contact: userInfo.alternate_contact,
      };
      
      setUser(userObj);
      localStorage.setItem("aegis_user", JSON.stringify(userObj));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    tokenManager.removeToken();
    localStorage.removeItem("aegis_user");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, login, register, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
