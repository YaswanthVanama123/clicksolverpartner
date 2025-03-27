import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import EncryptedStorage from 'react-native-encrypted-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';

export const LANGUAGE_KEY = 'APP_LANGUAGE';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const storedLang = await EncryptedStorage.getItem(LANGUAGE_KEY);
      callback(storedLang || 'en');
    } catch (error) {
      console.log('Language detection failed:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await EncryptedStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.log('Failed to cache language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      te: { translation: te },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
