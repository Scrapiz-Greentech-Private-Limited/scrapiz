/**
 * i18next configuration for multi-language support
 * Supports English, Hindi, Marathi, and Gujarati
 * Uses AsyncStorage for language persistence
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE } from './languages';

// Import translation resources
import en from './translations/en.json';
import hi from './translations/hi.json';
import mr from './translations/mr.json';
import gu from './translations/gu.json';

/**
 * Custom language detector plugin for i18next
 * Detects and caches user language preference in AsyncStorage
 */
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  
  /**
   * Detect the user's preferred language from AsyncStorage
   * Falls back to DEFAULT_LANGUAGE (English) if not found or on error
   */
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage) {
        console.log('[i18n] Detected saved language:', savedLanguage);
        callback(savedLanguage);
      } else {
        console.log('[i18n] No saved language found, using default:', DEFAULT_LANGUAGE);
        callback(DEFAULT_LANGUAGE);
      }
    } catch (error) {
      console.error('[i18n] Error detecting language from AsyncStorage:', error);
      console.log('[i18n] Falling back to default language:', DEFAULT_LANGUAGE);
      callback(DEFAULT_LANGUAGE);
    }
  },
  
  init: () => {
    console.log('[i18n] Language detector initialized');
  },
  
  /**
   * Cache the user's language preference to AsyncStorage
   * Handles errors gracefully with logging
   */
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      console.log('[i18n] Language cached successfully:', language);
    } catch (error) {
      console.error('[i18n] Failed to cache language to AsyncStorage:', error);
    }
  }
};

/**
 * Initialize i18next with configuration
 */
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // Translation resources for all supported languages
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      gu: { translation: gu }
    },
    
    // Fallback language when translation is missing
    fallbackLng: DEFAULT_LANGUAGE,
    
    // Compatibility with JSON v3 format
    compatibilityJSON: 'v3',
    
    // Interpolation options
    interpolation: {
      escapeValue: false // React Native doesn't need HTML escaping
    },
    
    // React-specific options
    react: {
      useSuspense: false // Disable suspense for React Native
    },
    
    // Enable debug mode in development
    debug: __DEV__,
    
    // Handle missing keys
    saveMissing: false,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (__DEV__) {
        console.warn(`[i18n] Missing translation key: ${key} for languages: ${lngs.join(', ')}`);
      }
    },
    
    // Return empty string for missing keys instead of the key itself
    returnEmptyString: false,
    returnNull: false
  })
  .catch((error) => {
    console.error('[i18n] Initialization error:', error);
  });

// Log initialization success
i18n.on('initialized', () => {
  console.log('[i18n] i18next initialized successfully');
  console.log('[i18n] Current language:', i18n.language);
  console.log('[i18n] Available languages:', Object.keys(i18n.services.resourceStore.data));
});

// Log language changes
i18n.on('languageChanged', (lng) => {
  console.log('[i18n] Language changed to:', lng);
});

// Log missing keys in development
if (__DEV__) {
  i18n.on('missingKey', (lngs, namespace, key, res) => {
    console.warn('[i18n] Missing key:', { lngs, namespace, key, res });
  });
}

export default i18n;
