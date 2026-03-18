import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBillStore } from '../../store';
import { ScreenHeader, Button, Card, PersonChip } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/helpers';
import type { BillItem } from '../../types';

export function AssignItemsScreen() {
    const navigation = useNavigation<any>();
    const { currentBill, toggleAssignment, assignAllToEveryone } = useBillStore();

    const items = currentBill?.items ?? [];
    const people = currentBill?.people ?? [];

    const allAssigned = items.every((item) => item.assignedTo.length > 0);

    const handleContinue = () => {
        navigation.navigate('BillSummary');
    };

    const renderItem = ({ item }: { item: BillItem }) => {
        const assignedCount = item.assignedTo.length;
        const isShared = assignedCount > 1;

        return (
            <Card style={styles.itemCard}>
                <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                    {isShared && (
                        <View style={styles.splitBadge}>
                            <Text style={styles.splitText}>
                                ÷{assignedCount}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.peopleRow}>
                    {people.map((person) => {
                        const isSelected = item.assignedTo.includes(person.id);
                        return (
                            <PersonChip
                                key={person.id}
                                name={person.name}
                                selected={isSelected}
                                onPress={() => toggleAssignment(item.id, person.id)}
                            />
                        );
                    })}
                </View>
                {assignedCount === 0 && (
                    <Text style={styles.unassignedHint}>
                        Tap a person to assign this item
                    </Text>
                )}
                {isShared && (
                    <Text style={styles.perPersonText}>
                        {formatCurrency(item.price / assignedCount)} per person
                    </Text>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader
                title="Assign Items"
                subtitle={`${items.length} items to assign`}
                onBack={() => navigation.goBack()}
                rightAction={
                    <TouchableOpacity
                        onPress={assignAllToEveryone}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="people" size={22} color={Colors.teal} />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <TouchableOpacity
                        style={styles.splitAllBtn}
                        onPress={assignAllToEveryone}
                    >
                        <Ionicons name="grid-outline" size={18} color={Colors.teal} />
                        <Text style={styles.splitAllText}>Split all items evenly</Text>
                    </TouchableOpacity>
                }
            />

            <View style={styles.bottomBar}>
                <Button
                    title="View Summary"
                    onPress={handleContinue}
                    disabled={!allAssigned}
                    icon={<Ionicons name="calculator" size={20} color={Colors.white} />}
                    style={styles.continueBtn}
                />
                {!allAssigned && (
                    <Text style={styles.hintText}>
                        Assign all items to continue
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    list: {
        padding: Spacing.md,
        paddingBottom: 160,
    },
    splitAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm + 2,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.teal + '30',
        borderStyle: 'dashed',
        backgroundColor: Colors.teal + '08',
    },
    splitAllText: {
        fontSize: FontSize.sm,
        color: Colors.teal,
        fontWeight: FontWeight.medium,
    },
    itemCard: {
        marginBottom: Spacing.md,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    itemInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
        flex: 1,
    },
    itemPrice: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
        marginLeft: Spacing.md,
    },
    splitBadge: {
        backgroundColor: Colors.gold + '30',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        marginLeft: Spacing.sm,
    },
    splitText: {
        fontSize: FontSize.xs,
        color: Colors.goldDark,
        fontWeight: FontWeight.bold,
    },
    peopleRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    unassignedHint: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        fontStyle: 'italic',
        marginTop: Spacing.sm,
    },
    perPersonText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
        fontWeight: FontWeight.medium,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        alignItems: 'center',
    },
    continueBtn: {
        width: '100%',
    },
    hintText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.sm,
    },
});
