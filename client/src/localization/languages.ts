/**
 * Language configuration for the localization system
 * Defines supported languages and related constants
 */

export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'ur'; 

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  icon: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Array of all supported languages in the application
 * Includes English, Hindi, Marathi, and Gujarati
 */
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    icon: 'Aa',
    direction: 'ltr'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    icon: 'आ',
    direction: 'ltr'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    icon: 'आ',
    direction: 'ltr'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    icon: 'આ',
    direction: 'ltr'
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    icon: 'آ',
    direction: 'rtl'
  }
];

/**
 * Default language used when no preference is set
 */
export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * AsyncStorage key for persisting user language preference
 */
export const LANGUAGE_STORAGE_KEY = 'userLanguage';
