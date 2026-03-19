import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const FREE_PERSON_LIMIT = 3;

interface PremiumStore {
    isPremium: boolean;
    unlock: () => void;
    restore: () => Promise<boolean>;
    purchasePremium: () => Promise<boolean>;
    canAddPerson: (currentCount: number) => boolean;
}

export const usePremiumStore = create<PremiumStore>()(
    persist(
        (set, get) => ({
            isPremium: false,
            unlock: () => set({ isPremium: true }),
            restore: async () => {
                if (Platform.OS === 'web') return false;
                try {
                    const Purchases = (await import('react-native-purchases')).default;
                    const customerInfo = await Purchases.restorePurchases();
                    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
                    if (hasPremium) set({ isPremium: true });
                    return hasPremium;
                } catch {
                    return false;
                }
            },
            purchasePremium: async () => {
                if (Platform.OS === 'web') return false;
                try {
                    const Purchases = (await import('react-native-purchases')).default;
                    const offerings = await Purchases.getOfferings();
                    const pkg = offerings.current?.availablePackages[0];
                    if (!pkg) return false;
                    const { customerInfo } = await Purchases.purchasePackage(pkg);
                    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
                    if (hasPremium) set({ isPremium: true });
                    return hasPremium;
                } catch {
                    return false;
                }
            },
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
