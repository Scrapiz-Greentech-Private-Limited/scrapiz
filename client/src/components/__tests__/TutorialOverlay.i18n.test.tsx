/**
 * Internationalization tests for TutorialOverlay component
 * Tests that tutorial UI elements use translations correctly
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import TutorialOverlay from '../TutorialOverlay';
import { useTutorialStore } from '@/src/store/tutorialStore';
import { useTheme } from '@/src/context/ThemeContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import i18n from '@/src/localization/i18n';

// Mock dependencies
jest.mock('@/src/store/tutorialStore');
jest.mock('@/src/context/ThemeContext');
jest.mock('@/src/context/LocalizationContext');

const mockUseTutorialStore = useTutorialStore as jest.MockedFunction<typeof useTutorialStore>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseLocalization = useLocalization as jest.MockedFunction<typeof useLocalization>;

describe('TutorialOverlay Internationalization', () => {
  const mockTheme = {
    colors: {
      card: '#ffffff',
      border: '#e5e7eb',
      shadow: '#000000',
      primary: '#16a34a',
      text: '#111827',
      textSecondary: '#6b7280',
    },
    isDark: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock theme
    mockUseTheme.mockReturnValue(mockTheme);
  });

  it('should use translated text for UI buttons in English', () => {
    // Set language to English
    i18n.changeLanguage('en');
    
    // Mock localization
    mockUseLocalization.mockReturnValue({
      t: i18n.t,
      currentLanguage: 'en',
      changeLanguage: jest.fn(),
      isLanguageSet: true,
      isLoading: false,
      languages: [],
    });

    // Mock tutorial store with active tutorial
    mockUseTutorialStore.mockReturnValue({
      isActive: true,
      currentStepIndex: 0,
      steps: [
        {
          id: 'test-step',
          title: 'Test Title',
          description: 'Test Description',
        },
      ],
      currentScreen: 'test',
      completedTutorials: new Set(),
      nextStep: jest.fn(),
      skipTutorial: jest.fn(),
      completeTutorial: jest.fn(),
      startTutorial: jest.fn(),
      previousStep: jest.fn(),
      setStepTarget: jest.fn(),
      loadCompletionStates: jest.fn(),
      saveCompletionState: jest.fn(),
      resetTutorial: jest.fn(),
      resetAllTutorials: jest.fn(),
    });

    const { getByText } = render(<TutorialOverlay />);

    // Check that English translations are used
    expect(getByText('Next')).toBeTruthy();
    expect(getByText('Skip Tutorial')).toBeTruthy();
  });

  it('should use translated text for UI buttons in Hindi', () => {
    // Set language to Hindi
    i18n.changeLanguage('hi');
    
    // Mock localization
    mockUseLocalization.mockReturnValue({
      t: i18n.t,
      currentLanguage: 'hi',
      changeLanguage: jest.fn(),
      isLanguageSet: true,
      isLoading: false,
      languages: [],
    });

    // Mock tutorial store with active tutorial
    mockUseTutorialStore.mockReturnValue({
      isActive: true,
      currentStepIndex: 0,
      steps: [
        {
          id: 'test-step',
          title: 'Test Title',
          description: 'Test Description',
        },
      ],
      currentScreen: 'test',
      completedTutorials: new Set(),
      nextStep: jest.fn(),
      skipTutorial: jest.fn(),
      completeTutorial: jest.fn(),
      startTutorial: jest.fn(),
      previousStep: jest.fn(),
      setStepTarget: jest.fn(),
      loadCompletionStates: jest.fn(),
      saveCompletionState: jest.fn(),
      resetTutorial: jest.fn(),
      resetAllTutorials: jest.fn(),
    });

    const { getByText } = render(<TutorialOverlay />);

    // Check that Hindi translations are used
    expect(getByText('अगला')).toBeTruthy(); // Next in Hindi
    expect(getByText('ट्यूटोरियल छोड़ें')).toBeTruthy(); // Skip Tutorial in Hindi
  });

  it('should display "Finish" button on last step in English', () => {
    // Set language to English
    i18n.changeLanguage('en');
    
    // Mock localization
    mockUseLocalization.mockReturnValue({
      t: i18n.t,
      currentLanguage: 'en',
      changeLanguage: jest.fn(),
      isLanguageSet: true,
      isLoading: false,
      languages: [],
    });

    // Mock tutorial store with last step active
    mockUseTutorialStore.mockReturnValue({
      isActive: true,
      currentStepIndex: 2,
      steps: [
        { id: 'step1', title: 'Step 1', description: 'Description 1' },
        { id: 'step2', title: 'Step 2', description: 'Description 2' },
        { id: 'step3', title: 'Step 3', description: 'Description 3' },
      ],
      currentScreen: 'test',
      completedTutorials: new Set(),
      nextStep: jest.fn(),
      skipTutorial: jest.fn(),
      completeTutorial: jest.fn(),
      startTutorial: jest.fn(),
      previousStep: jest.fn(),
      setStepTarget: jest.fn(),
      loadCompletionStates: jest.fn(),
      saveCompletionState: jest.fn(),
      resetTutorial: jest.fn(),
      resetAllTutorials: jest.fn(),
    });

    const { getByText } = render(<TutorialOverlay />);

    // Check that "Finish" is displayed instead of "Next"
    expect(getByText('Finish')).toBeTruthy();
  });

  it('should use step indicator format from translations', () => {
    // Set language to English
    i18n.changeLanguage('en');
    
    // Mock localization
    mockUseLocalization.mockReturnValue({
      t: i18n.t,
      currentLanguage: 'en',
      changeLanguage: jest.fn(),
      isLanguageSet: true,
      isLoading: false,
      languages: [],
    });

    // Mock tutorial store
    mockUseTutorialStore.mockReturnValue({
      isActive: true,
      currentStepIndex: 1,
      steps: [
        { id: 'step1', title: 'Step 1', description: 'Description 1' },
        { id: 'step2', title: 'Step 2', description: 'Description 2' },
        { id: 'step3', title: 'Step 3', description: 'Description 3' },
      ],
      currentScreen: 'test',
      completedTutorials: new Set(),
      nextStep: jest.fn(),
      skipTutorial: jest.fn(),
      completeTutorial: jest.fn(),
      startTutorial: jest.fn(),
      previousStep: jest.fn(),
      setStepTarget: jest.fn(),
      loadCompletionStates: jest.fn(),
      saveCompletionState: jest.fn(),
      resetTutorial: jest.fn(),
      resetAllTutorials: jest.fn(),
    });

    const { getByText } = render(<TutorialOverlay />);

    // Check that step indicator uses correct format (2/3)
    expect(getByText('2/3')).toBeTruthy();
  });
});
