import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, usePremiumStore } from '../../store';
import { Input, Card, PremiumGate } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';

export function SettingsScreen() {
    const { settings, updateSettings } = useSettingsStore();
    const { isPremium, unlock } = usePremiumStore();
    const [showPremiumGate, setShowPremiumGate] = useState(false);
    const tapCountRef = useRef(0);
    const lastTapRef = useRef(0);

    const handleVersionTap = () => {
        if (!__DEV__) return;
        const now = Date.now();
        if (now - lastTapRef.current > 2000) tapCountRef.current = 0;
        lastTapRef.current = now;
        tapCountRef.current += 1;
        if (tapCountRef.current >= 7) {
            tapCountRef.current = 0;
            if (isPremium) {
                Alert.alert('Dev Mode', 'Premium is already active.');
            } else {
                unlock();
                Alert.alert('Dev Mode', 'Premium unlocked for testing.');
            }
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Your payment details for sharing</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Premium */}
                    {isPremium ? (
                        <Card style={styles.premiumActiveCard}>
                            <View style={styles.premiumActiveRow}>
                                <Text style={styles.premiumCrown}>👑</Text>
                                <View style={styles.premiumActiveInfo}>
                                    <Text style={styles.premiumActiveTitle}>PayBack Premium</Text>
                                    <Text style={styles.premiumActiveStatus}>Active — Thank you!</Text>
                                </View>
                            </View>
                        </Card>
                    ) : (
                        <TouchableOpacity onPress={() => setShowPremiumGate(true)} activeOpacity={0.8}>
                            <Card style={styles.premiumCard}>
                                <View style={styles.premiumRow}>
                                    <Text style={styles.premiumCrown}>👑</Text>
                                    <View style={styles.premiumInfo}>
                                        <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                                        <Text style={styles.premiumSub}>WhatsApp sharing, OCR scanning, unlimited people</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={Colors.gold} />
                                </View>
                                <View style={styles.premiumPriceBadge}>
                                    <Text style={styles.premiumPrice}>R49.99</Text>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}

                    <PremiumGate visible={showPremiumGate} onClose={() => setShowPremiumGate(false)} />

                    {/* Personal */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-outline" size={20} color={Colors.teal} />
                            <Text style={styles.sectionTitle}>Personal Info</Text>
                        </View>
                        <Input
                            label="Your Name"
                            placeholder="Enter your name"
                            value={settings.name}
                            onChangeText={(text) => updateSettings({ name: text })}
                        />
                    </Card>

                    {/* Bank Details */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="card-outline" size={20} color={Colors.teal} />
                            <Text style={styles.sectionTitle}>Bank Details</Text>
                        </View>
                        <Text style={styles.sectionHint}>
                            These details are included when you share a bill summary
                        </Text>
                        <Input
                            label="Account Holder Name"
                            placeholder="e.g. John Doe"
                            value={settings.accountName}
                            onChangeText={(text) => updateSettings({ accountName: text })}
                        />
                        <Input
                            label="Bank Name"
                            placeholder="e.g. FNB, Capitec, Standard Bank"
                            value={settings.bankName}
                            onChangeText={(text) => updateSettings({ bankName: text })}
                        />
                        <Input
                            label="Account Number"
                            placeholder="Your account number"
                            value={settings.accountNumber}
                            onChangeText={(text) => updateSettings({ accountNumber: text })}
                            keyboardType="number-pad"
                        />
                        <Input
                            label="Branch Code"
                            placeholder="e.g. 250655"
                            value={settings.branchCode}
                            onChangeText={(text) => updateSettings({ branchCode: text })}
                            keyboardType="number-pad"
                        />
                    </Card>

                    {/* About */}
                    <Card style={styles.aboutCard}>
                        <Text style={styles.aboutTitle}>PayBack SA</Text>
                        <TouchableOpacity onPress={handleVersionTap} activeOpacity={1}>
                            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                        </TouchableOpacity>
                        <Text style={styles.aboutDescription}>
                            Split bills and track trip expenses with friends. Made in South Africa 🇿🇦
                        </Text>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    section: {
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    sectionHint: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginBottom: Spacing.md,
        lineHeight: 18,
    },
    aboutCard: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        marginBottom: Spacing.md,
    },
    aboutTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
    },
    aboutVersion: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
    },
    aboutDescription: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.md,
        lineHeight: 20,
        paddingHorizontal: Spacing.lg,
    },
    premiumCard: {
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.gold,
        backgroundColor: Colors.gold + '08',
    },
    premiumRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    premiumCrown: {
        fontSize: 28,
    },
    premiumInfo: {
        flex: 1,
    },
    premiumTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    premiumSub: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    premiumPriceBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.teal,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.sm,
    },
    premiumPrice: {
        color: Colors.white,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    premiumActiveCard: {
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: '#25D366',
        backgroundColor: '#25D366' + '08',
    },
    premiumActiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    premiumActiveInfo: {
        flex: 1,
    },
    premiumActiveTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    premiumActiveStatus: {
        fontSize: FontSize.sm,
        color: '#25D366',
        fontWeight: FontWeight.medium,
        marginTop: 2,
    },
});
