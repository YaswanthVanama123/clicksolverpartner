import React from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext'; // Ensure the path matches your project structure

const ThemeToggleIcon = () => {
  // Retrieve current theme state and toggle function from context
  const { isDarkMode, toggleTheme } = useTheme();

  // Decide which icon to display:
  // - When in dark mode, show a sun icon to indicate you can switch to light mode.
  // - When in light mode, show a moon icon to indicate you can switch to dark mode.
  const iconName = isDarkMode ? 'weather-sunny' : 'weather-night';

  return (
    <TouchableOpacity onPress={toggleTheme}>
      <MaterialCommunityIcons name={iconName} size={22} color="#656565" />
    </TouchableOpacity>
  );
};

export default ThemeToggleIcon;
