import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';

interface SettingsStore {
    settings: UserSettings;
    updateSettings: (updates: Partial<UserSettings>) => void;
}

const defaultSettings: UserSettings = {
    name: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchCode: '',
};

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            settings: defaultSettings,
            updateSettings: (updates) =>
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                })),
        }),
        {
            name: 'paybacksa-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
