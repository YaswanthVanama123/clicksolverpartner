import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

/*
  themeMode can be:
    - 'system': theme is determined by the device setting.
    - 'manual': user has manually chosen a theme.
  
  The isDarkMode state holds the actual theme value.
*/
export const ThemeProvider = ({ children }) => {
  // Initially, use system setting.
  const systemIsDark = Appearance.getColorScheme() === 'dark';
  const [themeMode, setThemeMode] = useState('system');
  const [isDarkMode, setIsDarkMode] = useState(systemIsDark);

  // When in system mode, listen for system changes.
  useEffect(() => {
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setIsDarkMode(colorScheme === 'dark');
      });
      return () => subscription.remove();
    }
  }, [themeMode]);

  // Toggle the theme manually.
  const toggleTheme = () => {
    // If we are in system mode, switch to manual mode first.
    if (themeMode === 'system') {
      setThemeMode('manual');
      // Toggle from what the system provided.
      setIsDarkMode(prev => !prev);
    } else {
      // In manual mode, just toggle the theme.
      setIsDarkMode(prev => !prev);
    }
  };

  // Revert back to following the system setting.
  const useSystemTheme = () => {
    setThemeMode('system');
    setIsDarkMode(Appearance.getColorScheme() === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, useSystemTheme, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for consuming the theme context.
export const useTheme = () => useContext(ThemeContext);
