import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark mode to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync with document on mount and listen for changes
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);

    // Listen for storage changes to sync across tabs
    const handleStorageChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    };

    // Listen for custom events from Layout component
    const handleDarkModeChange = (e: CustomEvent) => {
      setDarkMode(e.detail.darkMode);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('darkModeChange', handleDarkModeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('darkModeChange', handleDarkModeChange as EventListener);
    };
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('darkModeChange', { 
      detail: { darkMode: newDarkMode } 
    }));
  };

  return { darkMode, setDarkMode, toggleDarkMode };
}
