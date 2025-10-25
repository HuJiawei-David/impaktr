import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SuggestionRequest, SuggestionResult } from '@/lib/esg/suggestion/types';

interface SuggestionState {
  // Form data
  formData: SuggestionRequest;
  selectedSDGs: string[];
  
  // Results data
  result: SuggestionResult | null;
  selectedEvents: string[]; // Array instead of Set for serialization
  
  // Metadata for tracking when to invalidate
  organizationId: string | null;
  timestamp: number | null; // When the suggestion was generated
  
  // Actions
  setFormData: (data: SuggestionRequest) => void;
  setSelectedSDGs: (sdgs: string[]) => void;
  setResult: (result: SuggestionResult | null) => void;
  setSelectedEvents: (events: string[]) => void;
  setOrganizationId: (id: string) => void;
  updateTimestamp: () => void;
  clearSuggestions: () => void;
  
  // Check if settings have changed (to determine if we should clear)
  hasSettingsChanged: (newFormData: SuggestionRequest, newSelectedSDGs: string[]) => boolean;
}

const initialFormData: SuggestionRequest = {
  focus: {},
  targets: {},
  constraints: {},
};

export const useSuggestionStore = create<SuggestionState>()(
  persist(
    (set, get) => ({
      // Initial state
      formData: initialFormData,
      selectedSDGs: [],
      result: null,
      selectedEvents: [],
      organizationId: null,
      timestamp: null,
      
      // Set form data
      setFormData: (data) => set({ formData: data }),
      
      // Set selected SDGs
      setSelectedSDGs: (sdgs) => set({ selectedSDGs: sdgs }),
      
      // Set result
      setResult: (result) => set({ 
        result, 
        timestamp: result ? Date.now() : null 
      }),
      
      // Set selected events
      setSelectedEvents: (events) => set({ selectedEvents: events }),
      
      // Set organization ID
      setOrganizationId: (id) => set({ organizationId: id }),
      
      // Update timestamp
      updateTimestamp: () => set({ timestamp: Date.now() }),
      
      // Clear all suggestions and reset state
      clearSuggestions: () => set({
        formData: initialFormData,
        selectedSDGs: [],
        result: null,
        selectedEvents: [],
        timestamp: null,
      }),
      
      // Check if settings have changed
      hasSettingsChanged: (newFormData, newSelectedSDGs) => {
        const state = get();
        
        // Check if focus band changed
        if (state.formData.focus.band !== newFormData.focus.band) {
          return true;
        }
        
        // Check if SDGs changed
        const oldSDGs = state.selectedSDGs.sort().join(',');
        const newSDGs = newSelectedSDGs.sort().join(',');
        if (oldSDGs !== newSDGs) {
          return true;
        }
        
        // Check if targets changed
        if (state.formData.targets.hours !== newFormData.targets.hours ||
            state.formData.targets.participants !== newFormData.targets.participants ||
            state.formData.targets.orgScoreDelta !== newFormData.targets.orgScoreDelta) {
          return true;
        }
        
        // Check if constraints changed
        const oldConstraints = state.formData.constraints || {};
        const newConstraints = newFormData.constraints || {};
        
        if (oldConstraints.budget !== newConstraints.budget ||
            oldConstraints.maxEvents !== newConstraints.maxEvents ||
            oldConstraints.weekendsOnly !== newConstraints.weekendsOnly) {
          return true;
        }
        
        // Check if risk levels changed
        const oldRisk = (oldConstraints.riskAllowed || []).sort().join(',');
        const newRisk = (newConstraints.riskAllowed || []).sort().join(',');
        if (oldRisk !== newRisk) {
          return true;
        }
        
        return false;
      },
    }),
    {
      name: 'suggestion-storage', // localStorage key
      // Only persist specific fields
      partialize: (state) => ({
        formData: state.formData,
        selectedSDGs: state.selectedSDGs,
        result: state.result,
        selectedEvents: state.selectedEvents,
        organizationId: state.organizationId,
        timestamp: state.timestamp,
      }),
      // Ensure immediate persistence
      skipHydration: false,
      // Save immediately on changes
      onRehydrateStorage: () => (state) => {
        console.log('Suggestion store rehydrated from localStorage');
      },
    }
  )
);

