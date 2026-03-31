import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing } from '../theme';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    style?: ViewStyle;
}

export function ScreenHeader({
    title,
    subtitle,
    onBack,
    rightAction,
    style,
}: ScreenHeaderProps) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.row}>
                {onBack ? (
                    <TouchableOpacity
                        onPress={onBack}
                        style={styles.backButton}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <Ionicons name="chevron-back" size={24} color={Colors.teal} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backButton} />
                )}
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                <View style={styles.rightContainer}>
                    {rightAction || <View style={styles.backButton} />}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.background,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    rightContainer: {
        width: 40,
        alignItems: 'center',
    },
});
