import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../theme';
import { usePremiumStore } from '../store/premiumStore';

interface PremiumGateProps {
    visible: boolean;
    onClose: () => void;
    feature?: string;
}

const PREMIUM_FEATURES = [
    { icon: 'logo-whatsapp', label: 'WhatsApp sharing', color: '#25D366' },
    { icon: 'camera', label: 'OCR receipt scanning', color: Colors.teal },
    { icon: 'people', label: 'Unlimited people per bill', color: Colors.coral },
    { icon: 'analytics', label: 'Trip analytics', color: Colors.gold },
    { icon: 'ban', label: 'Ad-free experience', color: Colors.textSecondary },
];

export function PremiumGate({ visible, onClose, feature }: PremiumGateProps) {
    const { unlock } = usePremiumStore();

    const handleUpgrade = () => {
        // TODO: Replace with RevenueCat / expo-in-app-purchases
        Alert.alert(
            'PayBack Premium',
            'In-app purchases will be available once the app is published. For now, enjoy premium for free!',
            [
                {
                    text: 'Activate Premium',
                    onPress: () => {
                        unlock();
                        onClose();
                    },
                },
                { text: 'Not Now', style: 'cancel' },
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={24} color={Colors.textTertiary} />
                    </TouchableOpacity>

                    {/* Crown */}
                    <View style={styles.crownContainer}>
                        <Text style={styles.crown}>👑</Text>
                    </View>

                    <Text style={styles.title}>PayBack Premium</Text>
                    {feature && (
                        <Text style={styles.featureNote}>
                            {feature} is a premium feature
                        </Text>
                    )}

                    {/* Features list */}
                    <View style={styles.featuresList}>
                        {PREMIUM_FEATURES.map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                <Ionicons
                                    name={f.icon as any}
                                    size={20}
                                    color={f.color}
                                />
                                <Text style={styles.featureLabel}>{f.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Price */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Once-off payment</Text>
                        <Text style={styles.price}>R49.99</Text>
                        <Text style={styles.priceNote}>No subscriptions. Yours forever.</Text>
                    </View>

                    {/* Upgrade button */}
                    <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
                        <Ionicons name="star" size={20} color={Colors.white} />
                        <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.notNowBtn}>
                        <Text style={styles.notNowText}>Not now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        padding: Spacing.xs,
    },
    crownContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.gold + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    crown: {
        fontSize: 36,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    featureNote: {
        fontSize: FontSize.sm,
        color: Colors.coral,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.lg,
    },
    featuresList: {
        width: '100%',
        marginBottom: Spacing.lg,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    featureLabel: {
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        backgroundColor: Colors.teal + '08',
        borderRadius: BorderRadius.md,
        width: '100%',
    },
    priceLabel: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    price: {
        fontSize: 36,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
        marginVertical: Spacing.xs,
    },
    priceNote: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.teal,
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
        width: '100%',
    },
    upgradeBtnText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    notNowBtn: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    notNowText: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
    },
});
