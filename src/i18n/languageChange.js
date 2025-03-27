import i18n, { LANGUAGE_KEY } from './i18n';
import EncryptedStorage from 'react-native-encrypted-storage';

export async function changeAppLanguage(languageCode) {
  try {
    await i18n.changeLanguage(languageCode);
    await EncryptedStorage.setItem(LANGUAGE_KEY, languageCode);
    console.log('Language changed to:', languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
  }
}
