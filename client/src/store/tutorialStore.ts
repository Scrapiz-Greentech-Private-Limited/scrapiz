import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const TUTORIAL_STORAGE_KEY = '@scrapiz_tutorial_completions';

// Interfaces
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  spotlightRadius?: number;
}

export interface TutorialConfig {
  screenName: string;
  steps: TutorialStep[];
}

interface TutorialCompletionState {
  [screenName: string]: boolean;
}

export interface TutorialState {
  // Active tutorial state
  isActive: boolean;
  currentScreen: string | null;
  currentStepIndex: number;
  steps: TutorialStep[];
  
  // Completion tracking
  completedTutorials: Set<string>;
  
  // Actions
  startTutorial: (screenName: string, config: TutorialConfig) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  setStepTarget: (stepId: string, target: { x: number; y: number; width: number; height: number }) => void;
  loadCompletionStates: () => Promise<void>;
  saveCompletionState: (screenName: string) => Promise<void>;
  resetTutorial: (screenName: string) => Promise<void>;
  resetAllTutorials: () => Promise<void>;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  // Initial state
  isActive: false,
  currentScreen: null,
  currentStepIndex: 0,
  steps: [],
  completedTutorials: new Set<string>(),
  
  // Start a tutorial
  startTutorial: (screenName: string, config: TutorialConfig) => {
    // Validate configuration
    if (!config || typeof config !== 'object') {
      console.error('Invalid tutorial configuration: config must be an object');
      return;
    }
    
    if (!config.screenName || typeof config.screenName !== 'string') {
      console.error('Invalid tutorial configuration: screenName must be a string');
      return;
    }
    
    if (!Array.isArray(config.steps) || config.steps.length === 0) {
      console.error('Invalid tutorial configuration: steps must be a non-empty array');
      return;
    }
    
    // Validate each step has required fields
    const isValidSteps = config.steps.every(step => 
      step && 
      typeof step === 'object' &&
      typeof step.id === 'string' &&
      typeof step.title === 'string' &&
      typeof step.description === 'string'
    );
    
    if (!isValidSteps) {
      console.error('Invalid tutorial configuration: all steps must have id, title, and description');
      return;
    }
    
    set({
      isActive: true,
      currentScreen: screenName,
      currentStepIndex: 0,
      steps: config.steps,
    });
  },
  
  // Advance to next step
  nextStep: () => {
    const state = get();
    const nextIndex = state.currentStepIndex + 1;
    
    if (nextIndex >= state.steps.length) {
      // Reached the end, complete the tutorial
      get().completeTutorial();
    } else {
      set({ currentStepIndex: nextIndex });
    }
  },
  
  // Go back to previous step
  previousStep: () => {
    const state = get();
    const prevIndex = state.currentStepIndex - 1;
    
    if (prevIndex >= 0) {
      set({ currentStepIndex: prevIndex });
    }
  },
  
  // Skip tutorial without marking as complete
  skipTutorial: () => {
    set({
      isActive: false,
      currentScreen: null,
      currentStepIndex: 0,
      steps: [],
    });
  },
  
  // Complete tutorial and save state
  completeTutorial: () => {
    const state = get();
    const screenName = state.currentScreen;
    
    if (screenName) {
      const newCompletedTutorials = new Set(state.completedTutorials);
      newCompletedTutorials.add(screenName);
      
      set({
        isActive: false,
        currentScreen: null,
        currentStepIndex: 0,
        steps: [],
        completedTutorials: newCompletedTutorials,
      });
      
      // Persist to AsyncStorage
      get().saveCompletionState(screenName);
    }
  },
  
  // Update target element position for a specific step
  setStepTarget: (stepId: string, target: { x: number; y: number; width: number; height: number }) => {
    const state = get();
    const updatedSteps = state.steps.map(step =>
      step.id === stepId
        ? { ...step, targetElement: target }
        : step
    );
    
    set({ steps: updatedSteps });
  },
  
  // Load completion states from AsyncStorage
  loadCompletionStates: async () => {
    try {
      const storedData = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      
      if (storedData) {
        try {
          const completionState: TutorialCompletionState = JSON.parse(storedData);
          
          // Validate that the parsed data is an object
          if (typeof completionState !== 'object' || completionState === null || Array.isArray(completionState)) {
            console.warn('Invalid tutorial completion data structure, resetting to empty state');
            await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
            set({ completedTutorials: new Set<string>() });
            return;
          }
          
          const completedSet = new Set<string>();
          
          // Validate each entry
          Object.entries(completionState).forEach(([screenName, isCompleted]) => {
            if (typeof screenName === 'string' && typeof isCompleted === 'boolean' && isCompleted) {
              completedSet.add(screenName);
            }
          });
          
          set({ completedTutorials: completedSet });
        } catch (parseError) {
          // Handle corrupted JSON data
          console.warn('Corrupted tutorial completion data detected, clearing and resetting:', parseError);
          try {
            await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
          } catch (removeError) {
            console.error('Failed to remove corrupted data:', removeError);
          }
          set({ completedTutorials: new Set<string>() });
        }
      }
    } catch (error) {
      console.error('Failed to load tutorial completion states from AsyncStorage:', error);
      // On AsyncStorage error, treat all tutorials as incomplete
      set({ completedTutorials: new Set<string>() });
    }
  },
  
  // Save completion state for a specific tutorial
  saveCompletionState: async (screenName: string) => {
    try {
      const state = get();
      const storedData = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      
      let completionState: TutorialCompletionState = {};
      
      if (storedData) {
        try {
          completionState = JSON.parse(storedData);
          
          // Validate parsed data structure
          if (typeof completionState !== 'object' || completionState === null || Array.isArray(completionState)) {
            console.warn('Invalid stored data structure, starting fresh');
            completionState = {};
          }
        } catch (parseError) {
          console.warn('Corrupted tutorial data detected during save, resetting:', parseError);
          completionState = {};
        }
      }
      
      // Update the completion state
      completionState[screenName] = true;
      
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(completionState));
    } catch (error) {
      console.error('Failed to save tutorial completion state to AsyncStorage:', error);
      // Continue without crashing - user can still use the app
      // The tutorial will still be marked as complete in memory
    }
  },
  
  // Reset a specific tutorial
  resetTutorial: async (screenName: string) => {
    try {
      const state = get();
      const storedData = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      
      let completionState: TutorialCompletionState = {};
      
      if (storedData) {
        try {
          completionState = JSON.parse(storedData);
          
          // Validate parsed data structure
          if (typeof completionState !== 'object' || completionState === null || Array.isArray(completionState)) {
            console.warn('Invalid stored data structure during reset, starting fresh');
            completionState = {};
          }
        } catch (parseError) {
          console.warn('Corrupted tutorial data detected during reset, resetting:', parseError);
          completionState = {};
        }
      }
      
      // Remove the completion for this tutorial
      delete completionState[screenName];
      
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(completionState));
      
      // Update state
      const newCompletedTutorials = new Set(state.completedTutorials);
      newCompletedTutorials.delete(screenName);
      set({ completedTutorials: newCompletedTutorials });
    } catch (error) {
      console.error('Failed to reset tutorial in AsyncStorage:', error);
      // Still update in-memory state even if storage fails
      const state = get();
      const newCompletedTutorials = new Set(state.completedTutorials);
      newCompletedTutorials.delete(screenName);
      set({ completedTutorials: newCompletedTutorials });
    }
  },
  
  // Reset all tutorials
  resetAllTutorials: async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
      set({ completedTutorials: new Set<string>() });
    } catch (error) {
      console.error('Failed to reset all tutorials in AsyncStorage:', error);
      // Still update in-memory state even if storage fails
      set({ completedTutorials: new Set<string>() });
    }
  },
}));
