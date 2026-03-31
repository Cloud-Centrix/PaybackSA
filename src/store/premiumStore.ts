import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { FREE_PERSON_LIMIT } from '../types';

interface PremiumStore {
    isPremium: boolean;
    priceLabel: string;
    unlock: () => void;
    restore: () => Promise<boolean>;
    purchasePremium: () => Promise<boolean>;
    canAddPerson: (currentCount: number) => boolean;
    checkEntitlement: () => Promise<void>;
}

export const usePremiumStore = create<PremiumStore>()(
    persist(
        (set, get) => ({
            isPremium: false,
            priceLabel: 'R49.99',
            unlock: () => set({ isPremium: true }),

            /** Silently sync premium status with RevenueCat — uses cached state on failure */
            checkEntitlement: async () => {
                if (Platform.OS === 'web') return;
                try {
                    const Purchases = (await import('react-native-purchases')).default;
                    const customerInfo = await Purchases.getCustomerInfo();
                    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
                    set({ isPremium: hasPremium });

                    // Fetch live price from RevenueCat
                    const offerings = await Purchases.getOfferings();
                    const pkg = offerings.current?.availablePackages[0];
                    if (pkg?.product?.priceString) {
                        set({ priceLabel: pkg.product.priceString });
                    }
                } catch {
                    // Offline or RevenueCat unavailable — keep cached values
                }
            },

            restore: async () => {
                if (Platform.OS === 'web') return false;
                try {
                    const Purchases = (await import('react-native-purchases')).default;
                    const customerInfo = await Purchases.restorePurchases();
                    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
                    set({ isPremium: hasPremium });
                    return hasPremium;
                } catch {
                    Alert.alert(
                        'Restore Failed',
                        'Could not connect to the store. Check your internet connection and try again.'
                    );
                    return false;
                }
            },

            purchasePremium: async () => {
                if (Platform.OS === 'web') return false;
                try {
                    const Purchases = (await import('react-native-purchases')).default;
                    const offerings = await Purchases.getOfferings();
                    const pkg = offerings.current?.availablePackages[0];
                    if (!pkg) {
                        Alert.alert(
                            'Unavailable',
                            'Premium is not available right now. Please try again later.'
                        );
                        return false;
                    }
                    const { customerInfo } = await Purchases.purchasePackage(pkg);
                    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
                    if (hasPremium) set({ isPremium: true });
                    return hasPremium;
                } catch (e: any) {
                    // User cancelled — don't show an error
                    if (e?.userCancelled) return false;
                    Alert.alert(
                        'Purchase Failed',
                        'Something went wrong with the purchase. Please try again.'
                    );
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
