import React from 'react';
import {
    TextInput as RNTextInput,
    View,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps as RNTextInputProps,
} from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '../theme';

interface InputProps extends RNTextInputProps {
    label?: string;
    containerStyle?: ViewStyle;
    error?: string;
}

export function Input({ label, containerStyle, error, style, ...props }: InputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <RNTextInput
                style={[styles.input, error && styles.errorInput, style]}
                placeholderTextColor={Colors.textTertiary}
                accessibilityLabel={label || props.placeholder}
                accessibilityState={{ disabled: !props.editable && props.editable !== undefined }}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
        fontWeight: '500',
    },
    input: {
        backgroundColor: Colors.offWhite,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md - 2,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    errorInput: {
        borderColor: Colors.error,
    },
    errorText: {
        fontSize: FontSize.xs,
        color: Colors.error,
        marginTop: Spacing.xs,
    },
});
