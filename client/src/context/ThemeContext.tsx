import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors (green theme)
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  
  // Button colors
  buttonBackground: string;
  buttonText: string;
  buttonDisabled: string;
  
  // Tab bar colors
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  
  // Modal colors
  modalBackground: string;
  modalOverlay: string;
  
  // Special UI elements
  skeleton: string;
  shimmer: string;
  shadow: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  // Backgrounds - Using softer colors instead of pure white
  background: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  
  // Primary (Scrapiz Green)
  primary: '#16a34a',
  primaryDark: '#15803d',
  primaryLight: '#22c55e',
  
  // Status
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Borders
  border: '#e5e7eb',
  divider: '#f3f4f6',
  
  // Inputs
  inputBackground: '#ffffff',
  inputBorder: '#d1d5db',
  inputText: '#111827',
  inputPlaceholder: '#9ca3af',
  
  // Buttons
  buttonBackground: '#16a34a',
  buttonText: '#ffffff',
  buttonDisabled: '#d1d5db',
  
  // Tab Bar
  tabBarBackground: '#ffffff',
  tabBarActive: '#16a34a',
  tabBarInactive: '#9ca3af',
  
  // Modal
  modalBackground: '#ffffff',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  
  // Special
  skeleton: '#e5e7eb',
  shimmer: '#f3f4f6',
  shadow: '#000000',
};

const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0f172a',
  surface: '#1e293b',
  card: '#1e293b',
  
  // Text
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  
  // Primary (Brighter green for dark mode)
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryLight: '#4ade80',
  
  // Status
  success: '#10b981',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  
  // Borders
  border: '#334155',
  divider: '#1e293b',
  
  // Inputs
  inputBackground: '#1e293b',
  inputBorder: '#475569',
  inputText: '#f1f5f9',
  inputPlaceholder: '#64748b',
  
  // Buttons
  buttonBackground: '#22c55e',
  buttonText: '#0f172a',
  buttonDisabled: '#475569',
  
  // Tab Bar
  tabBarBackground: '#1e293b',
  tabBarActive: '#22c55e',
  tabBarInactive: '#64748b',
  
  // Modal
  modalBackground: '#1e293b',
  modalOverlay: 'rgba(0, 0, 0, 0.8)',
  
  // Special
  skeleton: '#334155',
  shimmer: '#475569',
  shadow: '#000000',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@scrapiz_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine actual theme based on mode
  const actualTheme: 'light' | 'dark' = 
    themeMode === 'auto' 
      ? (systemTheme === 'dark' ? 'dark' : 'light')
      : themeMode;

  const colors = actualTheme === 'dark' ? darkColors : lightColors;
  const isDark = actualTheme === 'dark';

  const value: ThemeContextType = {
    theme: actualTheme,
    themeMode,
    colors,
    setThemeMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for creating theme-aware styles
export const useThemedStyles = <T extends Record<string, any>>(
  stylesFn: (colors: ThemeColors, isDark: boolean) => T
): T => {
  const { colors, isDark } = useTheme();
  return stylesFn(colors, isDark);
};
