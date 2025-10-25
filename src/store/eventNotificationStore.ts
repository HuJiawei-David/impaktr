import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EventNotificationState {
  newEventCount: number;
  newFavoriteCount: number;
  incrementCount: (count?: number) => void;
  clearCount: () => void;
  resetCount: () => void;
  incrementFavoriteCount: (count?: number) => void;
  clearFavoriteCount: () => void;
  resetFavoriteCount: () => void;
}

export const useEventNotificationStore = create<EventNotificationState>()(
  persist(
    (set) => ({
      newEventCount: 0,
      newFavoriteCount: 0,
      
      // Increment the event notification count
      incrementCount: (count = 1) => set((state) => ({ 
        newEventCount: state.newEventCount + count 
      })),
      
      // Clear event notifications
      clearCount: () => set({ newEventCount: 0 }),
      
      // Reset event count to zero (alias for clearCount)
      resetCount: () => set({ newEventCount: 0 }),
      
      // Increment the favorite event notification count
      incrementFavoriteCount: (count = 1) => set((state) => ({ 
        newFavoriteCount: state.newFavoriteCount + count 
      })),
      
      // Clear favorite notifications
      clearFavoriteCount: () => set({ newFavoriteCount: 0 }),
      
      // Reset favorite count to zero
      resetFavoriteCount: () => set({ newFavoriteCount: 0 }),
    }),
    {
      name: 'event-notification-storage', // localStorage key
    }
  )
);

