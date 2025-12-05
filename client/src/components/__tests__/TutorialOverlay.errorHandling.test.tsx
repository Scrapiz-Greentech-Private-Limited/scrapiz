import React from 'react';
import { render } from '@testing-library/react-native';
import TutorialOverlay from '../TutorialOverlay';
import { useTutorialStore } from '../../store/tutorialStore';
import { useTheme } from '../../context/ThemeContext';

// Mock dependencies
jest.mock('../../store/tutorialStore');
jest.mock('../../context/ThemeContext');
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Defs: 'Defs',
  Rect: 'Rect',
  Mask: 'Mask',
  Circle: 'Circle',
}));

describe('TutorialOverlay - Error Handling', () => {
  const mockUseTutorialStore = useTutorialStore as jest.MockedFunction<typeof useTutorialStore>;
  const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Theme Context Unavailable', () => {
    it('should use fallback colors when theme context throws error', () => {
      // Mock useTheme to throw an error
      mockUseTheme.mockImplementation(() => {
        throw new Error('Theme context unavailable');
      });

      // Mock tutorial store with active tutorial
      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Should not throw and should render with fallback colors
      const { getByText } = render(<TutorialOverlay />);

      expect(getByText('Test Step')).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Theme context unavailable'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should use fallback colors when theme returns null', () => {
      // Mock useTheme to return null colors
      mockUseTheme.mockReturnValue({
        colors: null as any,
        isDark: false,
      });

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      // Should render without crashing
      const { getByText } = render(<TutorialOverlay />);
      expect(getByText('Test Step')).toBeTruthy();
    });
  });

  describe('Missing Target Elements', () => {
    beforeEach(() => {
      // Mock theme to return valid values
      mockUseTheme.mockReturnValue({
        colors: {
          card: '#ffffff',
          border: '#e5e7eb',
          shadow: '#000000',
          primary: '#16a34a',
          text: '#111827',
          textSecondary: '#6b7280',
        },
        isDark: false,
      });
    });

    it('should render without spotlight when targetElement is undefined', () => {
      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
            // No targetElement
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText, queryByTestId } = render(<TutorialOverlay />);

      // Should render tutorial card
      expect(getByText('Test Step')).toBeTruthy();
      expect(getByText('Test Description')).toBeTruthy();
    });

    it('should skip spotlight when targetElement has invalid dimensions', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
            targetElement: {
              x: 100,
              y: 100,
              width: 0, // Invalid width
              height: 50,
            },
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText } = render(<TutorialOverlay />);

      // Should still render tutorial card
      expect(getByText('Test Step')).toBeTruthy();
      
      // Should log warning about invalid dimensions
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid target element dimensions'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should skip spotlight when targetElement has negative dimensions', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
            targetElement: {
              x: 100,
              y: 100,
              width: -50, // Negative width
              height: 50,
            },
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText } = render(<TutorialOverlay />);

      expect(getByText('Test Step')).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should skip spotlight when targetElement has non-numeric values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
            targetElement: {
              x: 'invalid' as any,
              y: 100,
              width: 50,
              height: 50,
            },
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText } = render(<TutorialOverlay />);

      expect(getByText('Test Step')).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should render centered card when spotlight is skipped', () => {
      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
            // No targetElement - card should be centered
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText } = render(<TutorialOverlay />);

      // Card should still render with content
      expect(getByText('Test Step')).toBeTruthy();
      expect(getByText('Test Description')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
      expect(getByText('Skip Tutorial')).toBeTruthy();
    });
  });

  describe('Invalid Step Data', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        colors: {
          card: '#ffffff',
          border: '#e5e7eb',
          shadow: '#000000',
          primary: '#16a34a',
          text: '#111827',
          textSecondary: '#6b7280',
        },
        isDark: false,
      });
    });

    it('should not render when currentStepIndex is out of bounds', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 5, // Out of bounds
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { queryByText } = render(<TutorialOverlay />);

      // Should not render anything
      expect(queryByText('Test Step')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid step index:',
        5
      );

      consoleSpy.mockRestore();
    });

    it('should not render when currentStepIndex is negative', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: -1, // Negative index
        steps: [
          {
            id: 'step1',
            title: 'Test Step',
            description: 'Test Description',
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { queryByText } = render(<TutorialOverlay />);

      expect(queryByText('Test Step')).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not render when current step is null', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [null as any], // Null step
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { queryByText } = render(<TutorialOverlay />);

      expect(queryByText('Test Step')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid current step:',
        null
      );

      consoleSpy.mockRestore();
    });

    it('should not render when steps array is empty', () => {
      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [], // Empty steps
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { queryByText } = render(<TutorialOverlay />);

      // Should not render anything
      expect(queryByText('Test Step')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        colors: {
          card: '#ffffff',
          border: '#e5e7eb',
          shadow: '#000000',
          primary: '#16a34a',
          text: '#111827',
          textSecondary: '#6b7280',
        },
        isDark: false,
      });
    });

    it('should handle single-step tutorial correctly', () => {
      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: 'Only Step',
            description: 'This is the only step',
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText } = render(<TutorialOverlay />);

      // Should show "Finish" instead of "Next" for last step
      expect(getByText('Only Step')).toBeTruthy();
      expect(getByText('Finish')).toBeTruthy();
      expect(getByText('1/1')).toBeTruthy();
    });

    it('should handle very long tutorial text', () => {
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(500);

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: longTitle,
            description: longDescription,
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText } = render(<TutorialOverlay />);

      // Should render without crashing
      expect(getByText(longTitle)).toBeTruthy();
      expect(getByText(longDescription)).toBeTruthy();
    });

    it('should handle special characters in tutorial text', () => {
      const specialTitle = 'Test <>&"\'';
      const specialDescription = 'Description with émojis 🎉 and symbols ©®™';

      mockUseTutorialStore.mockReturnValue({
        isActive: true,
        currentStepIndex: 0,
        steps: [
          {
            id: 'step1',
            title: specialTitle,
            description: specialDescription,
          },
        ],
        nextStep: jest.fn(),
        skipTutorial: jest.fn(),
        completeTutorial: jest.fn(),
      } as any);

      const { getByText } = render(<TutorialOverlay />);

      expect(getByText(specialTitle)).toBeTruthy();
      expect(getByText(specialDescription)).toBeTruthy();
    });
  });
});
