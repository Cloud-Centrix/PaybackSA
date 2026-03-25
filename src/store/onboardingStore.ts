import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingStore {
    completed: boolean;
    complete: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
    persist(
        (set) => ({
            completed: false,
            complete: () => set({ completed: true }),
        }),
        {
            name: 'paybacksa-onboarding',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
