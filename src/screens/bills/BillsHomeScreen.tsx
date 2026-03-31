import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBillStore } from '../../store';
import { Card, EmptyState, Button } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../theme';
import { formatCurrency } from '../../utils/helpers';
import type { Bill } from '../../types';

export function BillsHomeScreen() {
    const navigation = useNavigation<any>();
    const { bills, deleteBill, setCurrentBill } = useBillStore();

    const sortedBills = [...bills].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleNewBill = () => {
        navigation.navigate('CreateBill');
    };

    const handleOpenBill = (bill: Bill) => {
        setCurrentBill(bill);
        navigation.navigate('BillSummary');
    };

    const handleDeleteBill = (bill: Bill) => {
        Alert.alert('Delete Bill', `Delete "${bill.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteBill(bill.id),
            },
        ]);
    };

    const getBillTotal = (bill: Bill) =>
        bill.items.reduce((sum, item) => sum + item.price, 0);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderBill = ({ item: bill }: { item: Bill }) => (
        <TouchableOpacity onPress={() => handleOpenBill(bill)} activeOpacity={0.7}>
            <Card style={styles.billCard}>
                <View style={styles.billHeader}>
                    <View style={styles.billIcon}>
                        <Ionicons name="receipt-outline" size={22} color={Colors.teal} />
                    </View>
                    <View style={styles.billInfo}>
                        <Text style={styles.billName} numberOfLines={1}>
                            {bill.name}
                        </Text>
                        <Text style={styles.billMeta}>
                            {bill.people.length} people · {bill.items.length} items
                        </Text>
                    </View>
                    <View style={styles.billRight}>
                        <Text style={styles.billTotal}>
                            {formatCurrency(getBillTotal(bill))}
                        </Text>
                        <Text style={styles.billDate}>{formatDate(bill.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDeleteBill(bill)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteBtn}
                    >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                </View>
                <View style={styles.peopleRow}>
                    {bill.people.slice(0, 4).map((person) => (
                        <View key={person.id} style={styles.miniAvatar}>
                            <Text style={styles.miniAvatarText}>
                                {(person.name?.[0] ?? '?').toUpperCase()}
                            </Text>
                        </View>
                    ))}
                    {bill.people.length > 4 && (
                        <Text style={styles.morePeople}>
                            +{bill.people.length - 4}
                        </Text>
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>PayBack SA</Text>
                    <Text style={styles.subtitle}>Split bills with friends</Text>
                </View>
                <View style={styles.logo}>
                    <Text style={styles.logoText}>🇿🇦</Text>
                </View>
            </View>

            <FlatList
                data={sortedBills}
                keyExtractor={(item) => item.id}
                renderItem={renderBill}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyState
                        icon="🧾"
                        title="No bills yet"
                        subtitle="Create your first bill to start splitting costs with friends"
                    />
                }
            />

            <View style={styles.fabContainer}>
                <TouchableOpacity style={styles.fab} onPress={handleNewBill} activeOpacity={0.8}>
                    <Ionicons name="add" size={28} color={Colors.white} />
                    <Text style={styles.fabText}>New Bill</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    greeting: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    logo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.offWhite,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: 24,
    },
    list: {
        padding: Spacing.md,
        paddingBottom: 100,
    },
    billCard: {
        marginBottom: Spacing.md,
    },
    billHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    billIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.teal + '12',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    billInfo: {
        flex: 1,
    },
    billName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    billMeta: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    billRight: {
        alignItems: 'flex-end',
        marginRight: Spacing.sm,
    },
    billTotal: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
    },
    billDate: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    deleteBtn: {
        padding: Spacing.xs,
    },
    peopleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        gap: -6,
    },
    miniAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.teal,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    miniAvatarText: {
        fontSize: 11,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    morePeople: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginLeft: Spacing.sm,
    },
    fabContainer: {
        position: 'absolute',
        bottom: Spacing.lg,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.teal,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
        gap: Spacing.sm,
        ...Shadow.lg,
    } as any,
    fabText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
