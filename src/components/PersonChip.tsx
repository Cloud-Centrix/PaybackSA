import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';

interface PersonChipProps {
    name: string;
    selected?: boolean;
    onPress?: () => void;
    onRemove?: () => void;
    style?: ViewStyle;
}

export function PersonChip({
    name,
    selected = false,
    onPress,
    onRemove,
    style,
}: PersonChipProps) {
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const chipContent = (
        <View
            style={[
                styles.chip,
                selected && styles.chipSelected,
                style,
            ]}
        >
            <View style={[styles.avatar, selected && styles.avatarSelected]}>
                <Text style={[styles.initials, selected && styles.initialsSelected]}>
                    {initials}
                </Text>
            </View>
            <Text style={[styles.name, selected && styles.nameSelected]}>{name}</Text>
            {onRemove && (
                <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {chipContent}
            </TouchableOpacity>
        );
    }

    return chipContent;
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.offWhite,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.sm + 2,
        gap: Spacing.sm,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: Colors.teal + '15',
        borderColor: Colors.teal,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarSelected: {
        backgroundColor: Colors.teal,
    },
    initials: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    initialsSelected: {
        color: Colors.white,
    },
    name: {
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
    },
    nameSelected: {
        color: Colors.teal,
    },
});
