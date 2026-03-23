import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    style,
}: ButtonProps) {
    const buttonStyles: ViewStyle[] = [
        styles.base,
        styles[`${variant}Bg` as keyof typeof styles] as ViewStyle,
        styles[`${size}Size` as keyof typeof styles] as ViewStyle,
        disabled && styles.disabled,
        style,
    ].filter(Boolean) as ViewStyle[];

    const textStyles: TextStyle[] = [
        styles.text,
        styles[`${variant}Text` as keyof typeof styles] as TextStyle,
        styles[`${size}Text` as keyof typeof styles] as TextStyle,
    ].filter(Boolean) as TextStyle[];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: disabled || loading, busy: loading }}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? Colors.white : Colors.teal}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text style={textStyles}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    // Variants
    primaryBg: {
        backgroundColor: Colors.teal,
        ...Shadow.md,
    } as ViewStyle,
    secondaryBg: {
        backgroundColor: Colors.coral,
        ...Shadow.md,
    } as ViewStyle,
    outlineBg: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.teal,
    },
    ghostBg: {
        backgroundColor: 'transparent',
    },
    // Sizes
    smSize: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    mdSize: {
        paddingVertical: Spacing.md - 2,
        paddingHorizontal: Spacing.lg,
    },
    lgSize: {
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.xl,
    },
    // Text
    text: {
        fontWeight: FontWeight.semibold,
    },
    primaryText: {
        color: Colors.white,
        fontSize: FontSize.md,
    },
    secondaryText: {
        color: Colors.white,
        fontSize: FontSize.md,
    },
    outlineText: {
        color: Colors.teal,
        fontSize: FontSize.md,
    },
    ghostText: {
        color: Colors.teal,
        fontSize: FontSize.md,
    },
    smText: {
        fontSize: FontSize.sm,
    },
    mdText: {
        fontSize: FontSize.md,
    },
    lgText: {
        fontSize: FontSize.lg,
    },
    disabled: {
        opacity: 0.5,
    },
});
