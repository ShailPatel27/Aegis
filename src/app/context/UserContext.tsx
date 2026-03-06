import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type UserType = "camera" | "monitor" | null;

interface User {
  type: UserType;
  cameraId?: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("aegis_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Save user to localStorage whenever it changes
    if (user) {
      localStorage.setItem("aegis_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("aegis_user");
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aegis_user");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
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
