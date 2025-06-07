import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark theme
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  // Function to get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to dark if can't detect
  };

  // Function to apply theme to document
  const applyTheme = (themeToApply: 'light' | 'dark') => {
    const root = document.documentElement;
    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setActualTheme(themeToApply);
  };

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply the theme immediately
    if (newTheme === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(newTheme);
    }
  };

  // Toggle between light and dark (ignoring system for manual toggle)
  const toggleTheme = () => {
    const newTheme = actualTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    // Check localStorage first, fallback to dark theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme || 'dark';
    
    setThemeState(initialTheme);

    // Apply initial theme
    if (initialTheme === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(initialTheme);
    }

    // Listen for system theme changes if using system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 