import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_PERSON_LIMIT = 3;

interface PremiumStore {
    isPremium: boolean;
    unlock: () => void;
    restore: () => void;
    canAddPerson: (currentCount: number) => boolean;
}

export const usePremiumStore = create<PremiumStore>()(
    persist(
        (set, get) => ({
            isPremium: false,
            unlock: () => set({ isPremium: true }),
            restore: () => set({ isPremium: true }),
            canAddPerson: (currentCount: number) =>
                get().isPremium || currentCount < FREE_PERSON_LIMIT,
        }),
        {
            name: 'paybacksa-premium',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export const FREE_PERSON_LIMIT_VALUE = FREE_PERSON_LIMIT;
