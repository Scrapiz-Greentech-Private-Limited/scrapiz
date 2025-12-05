import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTutorialStore } from '../tutorialStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const TUTORIAL_STORAGE_KEY = '@scrapiz_tutorial_completions';

describe('Tutorial Store - Error Handling', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the store state
    const store = useTutorialStore.getState();
    store.completedTutorials = new Set<string>();
    store.isActive = false;
    store.currentScreen = null;
    store.currentStepIndex = 0;
    store.steps = [];
  });

  describe('AsyncStorage Failures', () => {
    it('should handle AsyncStorage read failures gracefully', async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage read error')
      );

      // Load should not throw and should default to empty state
      await expect(
        useTutorialStore.getState().loadCompletionStates()
      ).resolves.not.toThrow();

      // Verify state is empty (all tutorials incomplete)
      expect(useTutorialStore.getState().completedTutorials.size).toBe(0);
    });

    it('should handle AsyncStorage write failures gracefully', async () => {
      // Mock AsyncStorage to throw an error on write
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage write error')
      );

      const mockConfig = {
        screenName: 'home',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Description 1' },
        ],
      };

      useTutorialStore.getState().startTutorial('home', mockConfig);
      
      // Complete tutorial should not throw even if save fails
      await expect(
        useTutorialStore.getState().completeTutorial()
      ).resolves.not.toThrow();

      // Tutorial should still be marked as complete in memory
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(true);
    });
  });

  describe('Corrupted Completion Data', () => {
    it('should handle corrupted JSON data gracefully', async () => {
      // Mock AsyncStorage to return invalid JSON
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        'invalid json {{'
      );

      // Load should not throw
      await expect(
        useTutorialStore.getState().loadCompletionStates()
      ).resolves.not.toThrow();

      // Verify state is empty (treats corrupted data as incomplete)
      expect(useTutorialStore.getState().completedTutorials.size).toBe(0);

      // Verify corrupted data was removed
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY);
    });

    it('should handle non-object completion data', async () => {
      // Mock AsyncStorage to return an array instead of object
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(['home', 'rates'])
      );

      // Load should not throw
      await expect(
        useTutorialStore.getState().loadCompletionStates()
      ).resolves.not.toThrow();

      // Verify state is empty (invalid structure)
      expect(useTutorialStore.getState().completedTutorials.size).toBe(0);

      // Verify corrupted data was removed
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY);
    });

    it('should handle null completion data', async () => {
      // Mock AsyncStorage to return null
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(null)
      );

      // Load should not throw
      await expect(
        useTutorialStore.getState().loadCompletionStates()
      ).resolves.not.toThrow();

      // Verify state is empty
      expect(useTutorialStore.getState().completedTutorials.size).toBe(0);
    });

    it('should filter out invalid entries in completion data', async () => {
      // Mock AsyncStorage with mixed valid/invalid entries
      const mockCompletionState = {
        home: true,
        rates: 'invalid', // Invalid type
        sell: false,
        services: true,
        123: true, // Valid but unusual key
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCompletionState)
      );

      await useTutorialStore.getState().loadCompletionStates();

      // Only valid entries should be loaded
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(true);
      expect(useTutorialStore.getState().completedTutorials.has('rates')).toBe(false);
      expect(useTutorialStore.getState().completedTutorials.has('sell')).toBe(false);
      expect(useTutorialStore.getState().completedTutorials.has('services')).toBe(true);
    });

    it('should handle corrupted data during save', async () => {
      // Mock AsyncStorage to return corrupted data on read
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        'invalid json'
      );

      // Save should not throw and should start fresh
      await expect(
        useTutorialStore.getState().saveCompletionState('home')
      ).resolves.not.toThrow();

      // Verify setItem was called with fresh data
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        TUTORIAL_STORAGE_KEY,
        JSON.stringify({ home: true })
      );
    });

    it('should handle corrupted data during reset', async () => {
      // Mock AsyncStorage to return corrupted data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        'invalid json'
      );

      // Reset should not throw
      await expect(
        useTutorialStore.getState().resetTutorial('home')
      ).resolves.not.toThrow();

      // Verify setItem was called with fresh data
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        TUTORIAL_STORAGE_KEY,
        JSON.stringify({})
      );
    });
  });

  describe('Invalid Tutorial Configuration', () => {
    it('should reject null configuration', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      useTutorialStore.getState().startTutorial('home', null as any);

      expect(useTutorialStore.getState().isActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should reject configuration without screenName', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidConfig = {
        steps: [{ id: 'step1', title: 'Step 1', description: 'Description 1' }],
      };
      
      useTutorialStore.getState().startTutorial('home', invalidConfig as any);

      expect(useTutorialStore.getState().isActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should reject configuration with empty steps array', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidConfig = {
        screenName: 'home',
        steps: [],
      };
      
      useTutorialStore.getState().startTutorial('home', invalidConfig);

      expect(useTutorialStore.getState().isActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should reject configuration with non-array steps', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidConfig = {
        screenName: 'home',
        steps: 'not an array',
      };
      
      useTutorialStore.getState().startTutorial('home', invalidConfig as any);

      expect(useTutorialStore.getState().isActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should reject configuration with invalid step objects', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidConfig = {
        screenName: 'home',
        steps: [
          { id: 'step1', title: 'Step 1' }, // Missing description
        ],
      };
      
      useTutorialStore.getState().startTutorial('home', invalidConfig as any);

      expect(useTutorialStore.getState().isActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should accept valid configuration', () => {
      const validConfig = {
        screenName: 'home',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Description 1' },
          { id: 'step2', title: 'Step 2', description: 'Description 2' },
        ],
      };
      
      useTutorialStore.getState().startTutorial('home', validConfig);

      expect(useTutorialStore.getState().isActive).toBe(true);
      expect(useTutorialStore.getState().currentScreen).toBe('home');
      expect(useTutorialStore.getState().steps.length).toBe(2);
    });
  });

  describe('Storage Failure Recovery', () => {
    it('should update in-memory state even if AsyncStorage fails during reset', async () => {
      // Setup: Load initial state
      const mockCompletionState = {
        home: true,
        rates: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCompletionState)
      );
      await useTutorialStore.getState().loadCompletionStates();

      // Mock AsyncStorage to fail on write
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage write error')
      );

      // Reset should still update in-memory state
      await useTutorialStore.getState().resetTutorial('home');

      // Verify in-memory state was updated despite storage failure
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(false);
      expect(useTutorialStore.getState().completedTutorials.has('rates')).toBe(true);
    });

    it('should update in-memory state even if AsyncStorage fails during resetAll', async () => {
      // Setup: Load initial state
      const mockCompletionState = {
        home: true,
        rates: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCompletionState)
      );
      await useTutorialStore.getState().loadCompletionStates();

      // Mock AsyncStorage to fail on remove
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
        new Error('Storage remove error')
      );

      // Reset all should still update in-memory state
      await useTutorialStore.getState().resetAllTutorials();

      // Verify in-memory state was cleared despite storage failure
      expect(useTutorialStore.getState().completedTutorials.size).toBe(0);
    });
  });
});

describe('Tutorial Store - Reset Functionality', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the store state
    const store = useTutorialStore.getState();
    store.completedTutorials = new Set<string>();
  });

  describe('resetTutorial', () => {
    it('should remove a specific tutorial from completion state', async () => {
      // Setup: Mock AsyncStorage with completed tutorials
      const mockCompletionState = {
        home: true,
        rates: true,
        sell: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCompletionState)
      );

      // Load completion states
      await useTutorialStore.getState().loadCompletionStates();
      
      // Verify initial state
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(true);
      expect(useTutorialStore.getState().completedTutorials.has('rates')).toBe(true);
      expect(useTutorialStore.getState().completedTutorials.has('sell')).toBe(true);

      // Reset the 'home' tutorial
      await useTutorialStore.getState().resetTutorial('home');

      // Verify AsyncStorage was updated correctly
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        TUTORIAL_STORAGE_KEY,
        JSON.stringify({ rates: true, sell: true })
      );

      // Verify store state was updated
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(false);
      expect(useTutorialStore.getState().completedTutorials.has('rates')).toBe(true);
      expect(useTutorialStore.getState().completedTutorials.has('sell')).toBe(true);
    });

    it('should handle resetting a non-existent tutorial gracefully', async () => {
      // Setup: Mock AsyncStorage with completed tutorials
      const mockCompletionState = {
        home: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCompletionState)
      );

      // Load completion states
      await useTutorialStore.getState().loadCompletionStates();

      // Reset a tutorial that doesn't exist
      await useTutorialStore.getState().resetTutorial('nonexistent');

      // Verify AsyncStorage was still updated (removing non-existent key is safe)
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // Verify store state remains consistent
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(true);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      // Setup: Mock AsyncStorage to throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      // Reset should not throw
      await expect(
        useTutorialStore.getState().resetTutorial('home')
      ).resolves.not.toThrow();
    });
  });

  describe('resetAllTutorials', () => {
    it('should clear all tutorial completions from AsyncStorage', async () => {
      // Setup: Mock AsyncStorage with completed tutorials
      const mockCompletionState = {
        home: true,
        rates: true,
        sell: true,
        services: true,
        profile: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCompletionState)
      );

      // Load completion states
      await useTutorialStore.getState().loadCompletionStates();
      
      // Verify initial state
      expect(useTutorialStore.getState().completedTutorials.size).toBe(5);

      // Reset all tutorials
      await useTutorialStore.getState().resetAllTutorials();

      // Verify AsyncStorage.removeItem was called
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY);

      // Verify store state was cleared
      expect(useTutorialStore.getState().completedTutorials.size).toBe(0);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      // Setup: Mock AsyncStorage to throw an error
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      // Reset should not throw
      await expect(
        useTutorialStore.getState().resetAllTutorials()
      ).resolves.not.toThrow();
    });
  });

  describe('Reset functionality integration', () => {
    it('should allow re-completing a tutorial after reset', async () => {
      // Setup: Complete a tutorial
      const mockConfig = {
        screenName: 'home',
        steps: [
          { id: 'step1', title: 'Step 1', description: 'Description 1' },
        ],
      };

      useTutorialStore.getState().startTutorial('home', mockConfig);
      await useTutorialStore.getState().completeTutorial();

      // Verify tutorial is completed
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(true);

      // Reset the tutorial
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ home: true })
      );
      await useTutorialStore.getState().resetTutorial('home');

      // Verify tutorial is no longer completed
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(false);

      // Complete the tutorial again
      useTutorialStore.getState().startTutorial('home', mockConfig);
      await useTutorialStore.getState().completeTutorial();

      // Verify tutorial is completed again
      expect(useTutorialStore.getState().completedTutorials.has('home')).toBe(true);
    });
  });
});
