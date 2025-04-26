// src/Components/LanguageSelector.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useTheme } from '../context/ThemeContext';
import { changeAppLanguage } from '../i18n/languageChange';

const languages = [
  { label: 'English', code: 'en' },
  { label: 'हिंदी',   code: 'hi' },
  { label: 'తెలుగు', code: 'te' },
];

const LanguageSelector = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const styles = useMemo(() => dynamicStyles(isDarkMode), [isDarkMode]);

  const [selectedLanguage, setSelectedLanguage] = useState(null);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await EncryptedStorage.getItem('selectedLanguage');
        const lang = saved || 'en';
        setSelectedLanguage(lang);
        changeAppLanguage(lang);
      } catch (err) {
        console.error('Error loading language:', err);
      }
    };
    loadSavedLanguage();
  }, []);

  const onSelectLanguage = (lang) => {
    setSelectedLanguage(lang.code);
    changeAppLanguage(lang.code);
  };

  const onSaveSettings = async () => {
    try {
      await EncryptedStorage.setItem('selectedLanguage', selectedLanguage);
      console.log('Language saved:', selectedLanguage);
      navigation.goBack();
    } catch (err) {
      console.error('Error saving language:', err);
    }
  };

  const getSelectedLabel = () => {
    const found = languages.find((l) => l.code === selectedLanguage);
    return found ? found.label : '';
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={styles.container.backgroundColor}
      />

      {/* Header with back icon */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.icon.color} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Languages</Text>
      </View>

      <Text style={styles.sectionTitle}>Selected Language</Text>
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedText}>{getSelectedLabel()}</Text>
      </View>

      <Text style={styles.sectionTitle}>All Languages</Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={styles.languageItem}
          onPress={() => onSelectLanguage(lang)}
        >
          <Text style={styles.languageText}>{lang.label}</Text>
          <Ionicons
            name={selectedLanguage === lang.code ? 'radio-button-on' : 'radio-button-off'}
            size={24}
            color={
              selectedLanguage === lang.code
                ? styles.radioActive.color
                : styles.radioInactive.color
            }
          />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={onSaveSettings}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LanguageSelector;

const lightTheme = {
  background: '#F5F6FA',
  cardBg: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#555555',
  border: '#DDDDDD',
  accent: '#FF5722',
  radioActive: '#FF5722',
  radioInactive: '#AAAAAA',
  icon: '#212121',
};

const darkTheme = {
  background: '#121212',
  cardBg: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#333333',
  accent: '#FF5722',
  radioActive: '#FF5722',
  radioInactive: '#777777',
  icon: '#FFFFFF',
};

function dynamicStyles(isDark) {
  const theme = isDark ? darkTheme : lightTheme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      marginRight: 16,
    },
    icon: {
      color: theme.icon,
    },
    headerText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    selectedContainer: {
      backgroundColor: theme.cardBg,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    selectedText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    languageText: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    radioActive: {
      color: theme.radioActive,
    },
    radioInactive: {
      color: theme.radioInactive,
    },
    saveButton: {
      backgroundColor: theme.accent,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    saveButtonText: {
      color: theme.cardBg,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
