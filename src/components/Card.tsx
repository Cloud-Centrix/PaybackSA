import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '../theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
    return (
        <View style={[styles.card, padded && styles.padded, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.lg,
        ...Shadow.sm,
    } as ViewStyle,
    padded: {
        padding: Spacing.md,
    },
});
