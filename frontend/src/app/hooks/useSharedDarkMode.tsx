import { useState, useEffect } from "react";

export function useSharedDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage on first load
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }
    return false;
  });

  // Apply dark mode to document and save to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode]);

  // Check for external changes (e.g., from other components)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentIsDark = document.documentElement.classList.contains('dark');
      if (currentIsDark !== darkMode) {
        setDarkMode(currentIsDark);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [darkMode]);

  return { darkMode, setDarkMode };
}
