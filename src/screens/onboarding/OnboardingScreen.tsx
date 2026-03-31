import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Screen } from '../../theme';
import { Input } from '../../components';
import { useSettingsStore } from '../../store/settingsStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { usePremiumStore } from '../../store/premiumStore';

const STEPS = ['welcome', 'name', 'bank', 'premium'] as const;
type Step = typeof STEPS[number];

const PREMIUM_FEATURES = [
    { icon: 'logo-whatsapp', label: 'WhatsApp sharing', color: '#25D366' },
    { icon: 'camera', label: 'OCR receipt scanning', color: Colors.teal },
    { icon: 'people', label: 'Unlimited people per bill', color: Colors.coral },
    { icon: 'analytics', label: 'Trip analytics', color: Colors.gold },
    { icon: 'ban', label: 'Ad-free experience', color: Colors.textSecondary },
];

export function OnboardingScreen() {
    const [step, setStep] = useState<Step>('welcome');
    const [name, setName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [branchCode, setBranchCode] = useState('');
    const [loading, setLoading] = useState(false);

    const { updateSettings } = useSettingsStore();
    const completeOnboarding = useOnboardingStore((s) => s.complete);
    const { purchasePremium, restore, priceLabel } = usePremiumStore();

    const currentIndex = STEPS.indexOf(step);

    const finish = () => {
        updateSettings({ name, bankName, accountName, accountNumber, branchCode });
        completeOnboarding();
    };

    const next = () => {
        if (currentIndex < STEPS.length - 1) {
            setStep(STEPS[currentIndex + 1]);
        } else {
            finish();
        }
    };

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const success = await purchasePremium();
            if (success) {
                Alert.alert('Welcome! 🎉', 'You now have PayBack Premium!', [
                    { text: 'Continue', onPress: finish },
                ]);
            }
        } catch {
            Alert.alert('Error', 'Something went wrong. You can upgrade later in Settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const success = await restore();
            if (success) {
                Alert.alert('Restored! 🎉', 'Your premium access has been restored.', [
                    { text: 'Continue', onPress: finish },
                ]);
            }
        } catch {
            Alert.alert('Error', 'Could not restore purchases.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Welcome ────────────────────────────────────────
    if (step === 'welcome') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.centered}>
                    <Text style={styles.welcomeEmoji}>🧾</Text>
                    <Text style={styles.welcomeTitle}>PayBack SA</Text>
                    <Text style={styles.welcomeTagline}>
                        Split bills and track expenses{'\n'}with your friends
                    </Text>
                    <View style={styles.featureHighlights}>
                        <HighlightRow icon="receipt-outline" text="Scan receipts and split instantly" />
                        <HighlightRow icon="people-outline" text="Track who owes what" />
                        <HighlightRow icon="logo-whatsapp" text="Share via WhatsApp" />
                        <HighlightRow icon="car-outline" text="Group trip expenses" />
                    </View>
                </View>
                <View style={styles.bottomSection}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={next}>
                        <Text style={styles.primaryBtnText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Name ───────────────────────────────────────────
    if (step === 'name') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <ProgressDots current={0} total={3} />
                    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
                        <Ionicons name="person-circle-outline" size={56} color={Colors.teal} />
                        <Text style={styles.stepTitle}>What's your name?</Text>
                        <Text style={styles.stepSubtitle}>
                            This is shown when you split bills with friends
                        </Text>
                        <Input
                            placeholder="Your name"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                            autoCapitalize="words"
                            returnKeyType="done"
                        />
                    </ScrollView>
                    <View style={styles.bottomSection}>
                        <TouchableOpacity
                            style={[styles.primaryBtn, !name.trim() && styles.disabledBtn]}
                            onPress={next}
                            disabled={!name.trim()}
                        >
                            <Text style={styles.primaryBtnText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // ─── Bank Details ───────────────────────────────────
    if (step === 'bank') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <ProgressDots current={1} total={3} />
                    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
                        <Ionicons name="card-outline" size={56} color={Colors.teal} />
                        <Text style={styles.stepTitle}>Your banking details</Text>
                        <Text style={styles.stepSubtitle}>
                            So friends know where to pay you back. You can always change this in Settings.
                        </Text>
                        <Input
                            label="Account Holder Name"
                            placeholder="e.g. John Doe"
                            value={accountName}
                            onChangeText={setAccountName}
                            autoCapitalize="words"
                        />
                        <Input
                            label="Bank Name"
                            placeholder="e.g. FNB, Capitec, Standard Bank"
                            value={bankName}
                            onChangeText={setBankName}
                            autoCapitalize="words"
                        />
                        <Input
                            label="Account Number"
                            placeholder="Your account number"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="number-pad"
                        />
                        <Input
                            label="Branch Code"
                            placeholder="e.g. 250655"
                            value={branchCode}
                            onChangeText={setBranchCode}
                            keyboardType="number-pad"
                        />
                    </ScrollView>
                    <View style={styles.bottomSection}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={next}>
                            <Text style={styles.primaryBtnText}>
                                {accountName || bankName || accountNumber ? 'Continue' : 'Skip for now'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // ─── Premium ────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ProgressDots current={2} total={3} />
            <ScrollView contentContainerStyle={styles.stepContent}>
                <View style={styles.crownContainer}>
                    <Text style={styles.crown}>👑</Text>
                </View>
                <Text style={styles.stepTitle}>Unlock Premium</Text>
                <Text style={styles.stepSubtitle}>
                    Get the most out of PayBack SA
                </Text>

                <View style={styles.featuresList}>
                    {PREMIUM_FEATURES.map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
                                <Ionicons name={f.icon as any} size={20} color={f.color} />
                            </View>
                            <Text style={styles.featureLabel}>{f.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Once-off payment</Text>
                    <Text style={styles.price}>{priceLabel}</Text>
                    <Text style={styles.priceNote}>No subscriptions. Yours forever.</Text>
                </View>
            </ScrollView>

            <View style={styles.bottomSection}>
                <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons name="star" size={20} color={Colors.white} />
                            <Text style={styles.upgradeBtnText}>Get Premium</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRestore} disabled={loading} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Restore Purchase</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={finish} style={styles.linkBtn}>
                    <Text style={styles.skipText}>Maybe Later</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Sub-components ─────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
    return (
        <View style={styles.dotsRow}>
            {Array.from({ length: total }, (_, i) => (
                <View
                    key={i}
                    style={[styles.dot, i === current && styles.dotActive, i < current && styles.dotDone]}
                />
            ))}
        </View>
    );
}

function HighlightRow({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.highlightRow}>
            <Ionicons name={icon as any} size={22} color={Colors.teal} />
            <Text style={styles.highlightText}>{text}</Text>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    stepContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
    },

    // Welcome
    welcomeEmoji: {
        fontSize: 72,
        marginBottom: Spacing.lg,
    },
    welcomeTitle: {
        fontSize: FontSize.hero,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
        marginBottom: Spacing.sm,
    },
    welcomeTagline: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: Spacing.xl,
    },
    featureHighlights: {
        alignSelf: 'stretch',
        gap: Spacing.md,
    },
    highlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    highlightText: {
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
    },

    // Progress dots
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.borderLight,
    },
    dotActive: {
        backgroundColor: Colors.teal,
        width: 24,
    },
    dotDone: {
        backgroundColor: Colors.teal + '60',
    },

    // Steps
    stepTitle: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    stepSubtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },

    // Bottom
    bottomSection: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    primaryBtn: {
        backgroundColor: Colors.teal,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    primaryBtnText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    disabledBtn: {
        opacity: 0.4,
    },

    // Premium
    crownContainer: {
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    crown: {
        fontSize: 56,
    },
    featuresList: {
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureLabel: {
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
    },
    priceCard: {
        backgroundColor: Colors.teal + '10',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.teal + '30',
    },
    priceLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    price: {
        fontSize: 36,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
        marginVertical: Spacing.xs,
    },
    priceNote: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
    },
    upgradeBtn: {
        backgroundColor: Colors.gold,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    upgradeBtnText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    linkBtn: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    linkText: {
        color: Colors.teal,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    skipText: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
});
