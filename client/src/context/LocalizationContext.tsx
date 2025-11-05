import React, { createContext, useContext, useState, useEffect } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import i18n from '../localization/i18n';
import { 
  Language, 
  LanguageOption, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  LANGUAGE_STORAGE_KEY 
} from '../localization/languages';

/**
 * LocalizationContext interface defining the shape of the context
 */
interface LocalizationContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  isLanguageSet: boolean;
  isLoading: boolean;
  t: TFunction;
  languages: LanguageOption[];
}

/**
 * Create the LocalizationContext with undefined as default
 */
const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

/**
 * Custom hook to use the LocalizationContext
 * Throws an error if used outside of LocalizationProvider
 */
export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

/**
 * LocalizationProvider component
 * Manages language state and provides localization functionality to the app
 */
export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLanguageSet, setIsLanguageSet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Initialize i18n and load saved language preference on mount
   */
  useEffect(() => {
    initializeLanguage();
  }, []);

  /**
   * Load saved language from AsyncStorage and initialize i18n
   */
  const initializeLanguage = async () => {
    try {
      setIsLoading(true);
      
      // Check if a language preference exists in AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage && isValidLanguage(savedLanguage)) {
        // Language preference exists - user has selected a language before
        console.log('[LocalizationContext] Saved language found:', savedLanguage);
        setCurrentLanguage(savedLanguage as Language);
        setIsLanguageSet(true);
        
        // Ensure i18n is using the saved language
        if (i18nInstance.language !== savedLanguage) {
          await i18nInstance.changeLanguage(savedLanguage);
        }
      } else {
        // No language preference - first time user
        console.log('[LocalizationContext] No saved language found, using default:', DEFAULT_LANGUAGE);
        setCurrentLanguage(DEFAULT_LANGUAGE);
        setIsLanguageSet(false);
        
        // Initialize i18n with default language
        if (i18nInstance.language !== DEFAULT_LANGUAGE) {
          await i18nInstance.changeLanguage(DEFAULT_LANGUAGE);
        }
      }
    } catch (error) {
      console.error('[LocalizationContext] Error initializing language:', error);
      // Fallback to default language on error
      setCurrentLanguage(DEFAULT_LANGUAGE);
      setIsLanguageSet(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate if a language code is supported
   */
  const isValidLanguage = (lang: string): boolean => {
    return SUPPORTED_LANGUAGES.some(l => l.code === lang);
  };

  /**
   * Change the current language
   * Updates i18n, saves to AsyncStorage, and shows toast notification
   * Handles errors with rollback to previous language
   */
  const changeLanguage = async (newLanguage: Language): Promise<void> => {
    // Store previous language for rollback on error
    const previousLanguage = currentLanguage;
    
    try {
      console.log('[LocalizationContext] Changing language from', previousLanguage, 'to', newLanguage);
      
      // Validate the new language
      if (!isValidLanguage(newLanguage)) {
        throw new Error(`Invalid language code: ${newLanguage}`);
      }
      
      // Update state immediately for responsive UI
      setCurrentLanguage(newLanguage);
      
      // Change language in i18n
      await i18nInstance.changeLanguage(newLanguage);
      
      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      
      // Mark language as set (for first-time users)
      if (!isLanguageSet) {
        setIsLanguageSet(true);
      }
      
      // Show success toast notification
      Toast.show({
        type: 'success',
        text1: t('notifications.languageChanged'),
        position: 'bottom',
        visibilityTime: 2000,
      });
      
      console.log('[LocalizationContext] Language changed successfully to:', newLanguage);
    } catch (error) {
      console.error('[LocalizationContext] Error changing language:', error);
      
      // Rollback to previous language on error
      setCurrentLanguage(previousLanguage);
      
      // Attempt to restore previous language in i18n
      try {
        await i18nInstance.changeLanguage(previousLanguage);
      } catch (rollbackError) {
        console.error('[LocalizationContext] Error rolling back language:', rollbackError);
      }
      
      // Show error toast notification
      Toast.show({
        type: 'error',
        text1: t('notifications.languageChangeFailed'),
        position: 'bottom',
        visibilityTime: 3000,
      });
      
      // Re-throw error for caller to handle if needed
      throw error;
    }
  };

  /**
   * Context value provided to all children
   */
  const value: LocalizationContextType = {
    currentLanguage,
    changeLanguage,
    isLanguageSet,
    isLoading,
    t,
    languages: SUPPORTED_LANGUAGES,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};
