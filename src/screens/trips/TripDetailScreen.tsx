import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTripStore, calculateBalances } from '../../store';
import { useSettingsStore } from '../../store';
import { ScreenHeader, Button, Card, Input, PersonChip } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/helpers';
import { shareNative, shareViaWhatsApp, shareViaEmail } from '../../utils/sharing';
import type { ExpenseCategory, TripExpense } from '../../types';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: string }[] = [
    { key: 'petrol', label: 'Petrol', icon: '⛽' },
    { key: 'groceries', label: 'Groceries', icon: '🛒' },
    { key: 'accommodation', label: 'Accommodation', icon: '🏠' },
    { key: 'food', label: 'Food & Drink', icon: '🍔' },
    { key: 'activities', label: 'Activities', icon: '🎯' },
    { key: 'transport', label: 'Transport', icon: '🚗' },
    { key: 'other', label: 'Other', icon: '📦' },
];

export function TripDetailScreen() {
    const navigation = useNavigation<any>();
    const { currentTrip, addExpense, removeExpense, saveTrip, togglePaidBack } = useTripStore();
    const { settings } = useSettingsStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBalances, setShowBalances] = useState(false);

    // Add expense form
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('other');
    const [paidBy, setPaidBy] = useState('');
    const [splitAmong, setSplitAmong] = useState<string[]>([]);

    const people = currentTrip?.people ?? [];
    const expenses = currentTrip?.expenses ?? [];
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const balances = useMemo(() => {
        if (!currentTrip) return [];
        return calculateBalances(currentTrip);
    }, [currentTrip]);

    // Per-person expense breakdown (what each person owes for)
    const personBreakdowns = useMemo(() => {
        if (!currentTrip) return [];
        return currentTrip.people.map((person) => {
            const items = currentTrip.expenses
                .filter((e) => e.splitAmong.includes(person.id))
                .map((e) => ({
                    description: e.description,
                    category: e.category,
                    share: e.amount / e.splitAmong.length,
                    paidByName: currentTrip.people.find((p) => p.id === e.paidBy)?.name ?? 'Unknown',
                    paidBySelf: e.paidBy === person.id,
                }));
            const totalOwed = items.reduce((s, i) => s + i.share, 0);
            const totalPaid = currentTrip.expenses
                .filter((e) => e.paidBy === person.id)
                .reduce((s, e) => s + e.amount, 0);
            const netOwes = totalOwed - totalPaid;
            return { person, items, totalOwed, totalPaid, netOwes };
        });
    }, [currentTrip]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setCategory('other');
        setPaidBy('');
        setSplitAmong([]);
    };

    const handleAddExpense = () => {
        const amt = parseFloat(amount);
        if (!description.trim() || isNaN(amt) || amt <= 0 || !paidBy || splitAmong.length === 0)
            return;

        addExpense({
            description: description.trim(),
            amount: Math.round(amt * 100) / 100,
            category,
            paidBy,
            splitAmong,
            date: new Date().toISOString(),
        });

        resetForm();
        setShowAddModal(false);
    };

    const handleDeleteExpense = (expense: TripExpense) => {
        Alert.alert('Remove Expense', `Remove "${expense.description}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeExpense(expense.id) },
        ]);
    };

    const handleSave = () => {
        saveTrip();
        Alert.alert('Saved!', 'Trip has been saved.', [
            { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
    };

    const handleShareBalances = () => {
        if (!currentTrip) return;
        let msg = `🏕️ ${currentTrip.name} - Balances\n\n`;
        if (balances.length === 0) {
            msg += 'All settled up! ✨\n';
        } else {
            balances.forEach((b) => {
                msg += `${b.from.name} → ${b.to.name}: ${formatCurrency(b.amount)}\n`;
            });
        }
        msg += `\nTotal expenses: ${formatCurrency(totalExpenses)}`;
        msg += '\n\nSent via PayBack SA 🇿🇦';
        shareNative(msg);
    };

    const handleGroupShare = () => {
        if (!currentTrip) return;
        let msg = `🏕️ *${currentTrip.name}* - Trip Summary\n\n`;
        msg += `👥 ${people.length} people · ${expenses.length} expenses\n`;
        msg += `💰 Total: ${formatCurrency(totalExpenses)}\n\n`;

        // Per-person expense breakdown
        personBreakdowns.forEach((pb) => {
            msg += `*${pb.person.name}* — owes ${formatCurrency(pb.totalOwed)}\n`;
            pb.items.forEach((item) => {
                const cat = getCategoryInfo(item.category);
                msg += `  ${cat.icon} ${item.description}: ${formatCurrency(item.share)}\n`;
            });
            msg += '\n';
        });

        if (balances.length === 0) {
            msg += 'All settled up! ✨\n';
        } else {
            msg += '*Who owes who:*\n';
            balances.forEach((b) => {
                const isPaid = currentTrip.paidBack?.[b.from.id] ?? false;
                const status = isPaid ? '✅' : '❌';
                msg += `  ${status} ${b.from.name} → ${b.to.name}: ${formatCurrency(b.amount)}${isPaid ? ' (PAID)' : ''}\n`;
            });
        }

        if (settings.accountName || settings.bankName) {
            msg += `\n🏦 *Bank Details for payment:*\n`;
            if (settings.accountName)
                msg += `  Account Name: ${settings.accountName}\n`;
            if (settings.bankName) msg += `  Bank: ${settings.bankName}\n`;
            if (settings.accountNumber)
                msg += `  Account No: ${settings.accountNumber}\n`;
            if (settings.branchCode)
                msg += `  Branch Code: ${settings.branchCode}\n`;
        }

        msg += '\nSent via PayBack SA 🇿🇦';
        shareViaWhatsApp(msg);
    };

    const toggleSplitPerson = (personId: string) => {
        setSplitAmong((prev) =>
            prev.includes(personId)
                ? prev.filter((id) => id !== personId)
                : [...prev, personId]
        );
    };

    const getCategoryInfo = (key: ExpenseCategory) =>
        CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[6];

    const getPersonName = (id: string) =>
        people.find((p) => p.id === id)?.name ?? 'Unknown';

    const handleSharePerson = (pb: typeof personBreakdowns[0], method: 'whatsapp' | 'email' | 'native') => {
        if (!currentTrip) return;
        const itemLines = pb.items
            .map((i) => {
                const cat = getCategoryInfo(i.category);
                return `  ${cat.icon} ${i.description}: ${formatCurrency(i.share)}`;
            })
            .join('\n');
        let msg = `Hey ${pb.person.name}! Here's your share of the trip:\n\n`;
        msg += `🏕️ ${currentTrip.name}\n\n`;
        msg += `Items:\n${itemLines}\n\n`;
        msg += `💰 Your share: ${formatCurrency(pb.totalOwed)}\n`;
        if (pb.totalPaid > 0) msg += `💳 You paid: ${formatCurrency(pb.totalPaid)}\n`;
        if (pb.netOwes > 0) msg += `📌 You owe: ${formatCurrency(pb.netOwes)}\n`;
        else if (pb.netOwes < 0) msg += `📌 You are owed: ${formatCurrency(Math.abs(pb.netOwes))}\n`;
        if (settings.accountName || settings.bankName) {
            msg += `\n🏦 Pay to:\n`;
            if (settings.accountName) msg += `  Account Name: ${settings.accountName}\n`;
            if (settings.bankName) msg += `  Bank: ${settings.bankName}\n`;
            if (settings.accountNumber) msg += `  Account No: ${settings.accountNumber}\n`;
            if (settings.branchCode) msg += `  Branch Code: ${settings.branchCode}\n`;
        }
        msg += `\nSent via PayBack SA 🇿🇦`;
        switch (method) {
            case 'whatsapp': shareViaWhatsApp(msg); break;
            case 'email': shareViaEmail(msg, `Your share of ${currentTrip.name}`); break;
            default: shareNative(msg);
        }
    };

    const renderExpense = ({ item: expense }: { item: TripExpense }) => {
        const cat = getCategoryInfo(expense.category);
        return (
            <Card style={styles.expenseCard}>
                <View style={styles.expenseRow}>
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <View style={styles.expenseInfo}>
                        <Text style={styles.expenseName}>{expense.description}</Text>
                        <Text style={styles.expenseMeta}>
                            Paid by {getPersonName(expense.paidBy)} · Split {expense.splitAmong.length} ways
                        </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                        {formatCurrency(expense.amount)}
                    </Text>
                    <TouchableOpacity
                        onPress={() => handleDeleteExpense(expense)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            </Card>
        );
    };

    if (!currentTrip) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader
                title={currentTrip.name}
                subtitle={`${expenses.length} expenses`}
                onBack={() => navigation.goBack()}
            />

            <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                renderItem={renderExpense}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View>
                        {/* Paid By */}
                        {currentTrip.paidBy && (
                            <Card style={styles.paidByCard}>
                                <Ionicons name="card-outline" size={20} color={Colors.coral} />
                                <Text style={styles.paidByLabel}>Main payer</Text>
                                <Text style={styles.paidByName}>{currentTrip.paidBy.name}</Text>
                            </Card>
                        )}

                        {/* Total card */}
                        <Card style={styles.totalCard}>
                            <Text style={styles.totalLabel}>Total Expenses</Text>
                            <Text style={styles.totalValue}>
                                {formatCurrency(totalExpenses)}
                            </Text>
                            <Text style={styles.totalPeople}>
                                {people.length} people · {expenses.length} expenses
                            </Text>
                        </Card>

                        {/* Balances */}
                        {balances.length > 0 && (
                            <Card style={styles.balancesCard}>
                                <TouchableOpacity
                                    style={styles.balancesHeader}
                                    onPress={() => setShowBalances(!showBalances)}
                                >
                                    <Ionicons name="swap-horizontal" size={20} color={Colors.coral} />
                                    <Text style={styles.balancesTitle}>Who Owes Who</Text>
                                    <Ionicons
                                        name={showBalances ? 'chevron-up' : 'chevron-down'}
                                        size={18}
                                        color={Colors.textTertiary}
                                    />
                                </TouchableOpacity>
                                {showBalances &&
                                    balances.map((b, i) => {
                                        const isPaid = currentTrip?.paidBack?.[b.from.id] ?? false;
                                        return (
                                            <View key={i} style={[styles.balanceRow, isPaid && styles.balanceRowPaid]}>
                                                <Text style={[styles.balanceFrom, isPaid && styles.balanceTextPaid]}>{b.from.name}</Text>
                                                <Ionicons name="arrow-forward" size={14} color={Colors.textTertiary} />
                                                <Text style={[styles.balanceTo, isPaid && styles.balanceTextPaid]}>{b.to.name}</Text>
                                                <Text style={[styles.balanceAmount, isPaid && styles.balanceAmountPaid]}>
                                                    {formatCurrency(b.amount)}
                                                </Text>
                                            </View>
                                        );
                                    })}
                            </Card>
                        )}

                        {/* Per-person breakdown */}
                        <Text style={styles.sectionTitle}>Each Person's Share</Text>
                        {personBreakdowns.map((pb) => {
                            const initials = pb.person.name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2);
                            const isPaid = currentTrip?.paidBack?.[pb.person.id] ?? false;
                            return (
                                <Card key={pb.person.id} style={isPaid ? { ...styles.personBreakdownCard, ...styles.personBreakdownCardPaid } : styles.personBreakdownCard}>
                                    <View style={styles.pbHeader}>
                                        <TouchableOpacity
                                            onPress={() => togglePaidBack(pb.person.id)}
                                            activeOpacity={0.7}
                                            style={styles.paidToggle}
                                        >
                                            <Ionicons
                                                name={isPaid ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={28}
                                                color={isPaid ? '#25D366' : Colors.textTertiary}
                                            />
                                        </TouchableOpacity>
                                        <View style={[styles.pbAvatar, isPaid && styles.pbAvatarPaid]}>
                                            <Text style={styles.pbAvatarText}>{initials}</Text>
                                        </View>
                                        <View style={styles.pbInfo}>
                                            <Text style={[styles.pbName, isPaid && styles.pbNamePaid]}>
                                                {pb.person.name}
                                            </Text>
                                            <Text style={styles.pbMeta}>
                                                {isPaid ? '✅ Paid' : `${pb.items.length} expense${pb.items.length !== 1 ? 's' : ''}`}
                                                {pb.totalPaid > 0 ? ` · Paid ${formatCurrency(pb.totalPaid)}` : ''}
                                            </Text>
                                        </View>
                                        <View style={styles.pbTotalWrap}>
                                            <Text style={[styles.pbTotal, isPaid ? styles.pbTotalPaid : pb.netOwes <= 0 && styles.pbTotalGreen]}>
                                                {pb.netOwes > 0
                                                    ? `Owes ${formatCurrency(pb.netOwes)}`
                                                    : pb.netOwes < 0
                                                        ? `Owed ${formatCurrency(Math.abs(pb.netOwes))}`
                                                        : 'Settled'}
                                            </Text>
                                        </View>
                                    </View>
                                    {pb.items.map((item, idx) => {
                                        const cat = CATEGORIES.find((c) => c.key === item.category) ?? CATEGORIES[6];
                                        return (
                                            <View key={idx} style={styles.pbItem}>
                                                <Text style={styles.pbItemIcon}>{cat.icon}</Text>
                                                <Text style={styles.pbItemName} numberOfLines={1}>
                                                    {item.description}
                                                </Text>
                                                <Text style={styles.pbItemAmount}>
                                                    {formatCurrency(item.share)}
                                                </Text>
                                            </View>
                                        );
                                    })}

                                    <View style={styles.shareActions}>
                                        <TouchableOpacity
                                            style={styles.shareBtn}
                                            onPress={() => handleSharePerson(pb, 'whatsapp')}
                                        >
                                            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                                            <Text style={[styles.shareBtnText, { color: '#25D366' }]}>
                                                WhatsApp
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.shareBtn}
                                            onPress={() => handleSharePerson(pb, 'email')}
                                        >
                                            <Ionicons name="mail-outline" size={18} color={Colors.teal} />
                                            <Text style={[styles.shareBtnText, { color: Colors.teal }]}>
                                                Email
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.shareBtn}
                                            onPress={() => handleSharePerson(pb, 'native')}
                                        >
                                            <Ionicons name="share-outline" size={18} color={Colors.coral} />
                                            <Text style={[styles.shareBtnText, { color: Colors.coral }]}>
                                                Share
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </Card>
                            );
                        })}

                        <Text style={styles.sectionTitle}>Expenses</Text>
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.footer}>
                        <Button
                            title="Share Summary to Group"
                            onPress={handleGroupShare}
                            variant="outline"
                            icon={<Ionicons name="logo-whatsapp" size={20} color="#25D366" />}
                            style={styles.groupShareBtn}
                        />
                        <Button
                            title="Save Trip"
                            onPress={handleSave}
                            variant="secondary"
                            icon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
                            style={styles.saveBtn}
                        />
                    </View>
                }
            />

            {/* FAB */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => {
                        resetForm();
                        if (currentTrip?.paidBy) {
                            setPaidBy(currentTrip.paidBy.id);
                        }
                        setSplitAmong(people.map((p) => p.id));
                        setShowAddModal(true);
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color={Colors.white} />
                </TouchableOpacity>
            </View>

            {/* Add Expense Modal */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <ScreenHeader
                        title="Add Expense"
                        onBack={() => setShowAddModal(false)}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <ScrollView
                            contentContainerStyle={styles.modalScroll}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Input
                                label="Description"
                                placeholder='e.g. "Petrol to Cape Town"'
                                value={description}
                                onChangeText={setDescription}
                            />
                            <Input
                                label="Amount"
                                placeholder="0.00"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />

                            {/* Category */}
                            <Text style={styles.fieldLabel}>Category</Text>
                            <View style={styles.categoryRow}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[
                                            styles.categoryChip,
                                            category === cat.key && styles.categoryChipActive,
                                        ]}
                                        onPress={() => setCategory(cat.key)}
                                    >
                                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                        <Text
                                            style={[
                                                styles.categoryLabel,
                                                category === cat.key && styles.categoryLabelActive,
                                            ]}
                                        >
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Paid by */}
                            <Text style={styles.fieldLabel}>Paid By</Text>
                            <View style={styles.peopleSelectRow}>
                                {people.map((person) => (
                                    <PersonChip
                                        key={person.id}
                                        name={person.name}
                                        selected={paidBy === person.id}
                                        onPress={() => setPaidBy(person.id)}
                                    />
                                ))}
                            </View>

                            {/* Split among */}
                            <Text style={styles.fieldLabel}>Split Among</Text>
                            <View style={styles.peopleSelectRow}>
                                {people.map((person) => (
                                    <PersonChip
                                        key={person.id}
                                        name={person.name}
                                        selected={splitAmong.includes(person.id)}
                                        onPress={() => toggleSplitPerson(person.id)}
                                    />
                                ))}
                            </View>

                            <Button
                                title="Add Expense"
                                onPress={handleAddExpense}
                                variant="secondary"
                                disabled={
                                    !description.trim() ||
                                    !amount.trim() ||
                                    !paidBy ||
                                    splitAmong.length === 0
                                }
                                style={styles.addExpenseBtn}
                            />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
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
        paddingBottom: 100,
    },
    paidByCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
        paddingVertical: Spacing.sm + 2,
    },
    paidByLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    paidByName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.coral,
    },
    totalCard: {
        backgroundColor: Colors.coral,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    totalLabel: {
        fontSize: FontSize.sm,
        color: Colors.white + 'CC',
    },
    totalValue: {
        fontSize: FontSize.hero,
        fontWeight: FontWeight.bold,
        color: Colors.white,
        marginVertical: Spacing.xs,
    },
    totalPeople: {
        fontSize: FontSize.xs,
        color: Colors.white + 'AA',
    },
    balancesCard: {
        marginBottom: Spacing.lg,
    },
    balancesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    balancesTitle: {
        flex: 1,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingLeft: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    balanceRowPaid: {
        opacity: 0.6,
    },
    balanceFrom: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.error,
    },
    balanceTo: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.success,
        flex: 1,
    },
    balanceAmount: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
    },
    balanceTextPaid: {
        textDecorationLine: 'line-through',
        color: Colors.textTertiary,
    },
    balanceAmountPaid: {
        textDecorationLine: 'line-through',
        color: '#25D366',
    },
    groupShareBtn: {
        marginTop: Spacing.lg,
        borderColor: '#25D366',
    },
    saveBtn: {
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    personBreakdownCard: {
        marginBottom: Spacing.md,
    },
    personBreakdownCardPaid: {
        opacity: 0.7,
        borderColor: '#25D366',
        borderWidth: 1,
    },
    paidToggle: {
        marginRight: Spacing.sm,
    },
    pbHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    pbAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.coral,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    pbAvatarPaid: {
        backgroundColor: '#25D366',
    },
    pbAvatarText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    pbInfo: {
        flex: 1,
    },
    pbName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    pbNamePaid: {
        textDecorationLine: 'line-through',
        color: Colors.textTertiary,
    },
    pbMeta: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    pbTotalWrap: {
        alignItems: 'flex-end',
    },
    pbTotal: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.coral,
    },
    pbTotalGreen: {
        color: '#25D366',
    },
    pbTotalPaid: {
        color: '#25D366',
        textDecorationLine: 'line-through',
    },
    pbItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingLeft: 44,
    },
    pbItemIcon: {
        fontSize: 14,
        marginRight: Spacing.xs,
    },
    pbItemName: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    pbItemAmount: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    shareActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.sm + 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.offWhite,
    },
    shareBtnText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    expenseCard: {
        marginBottom: Spacing.sm,
    },
    expenseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    catIcon: {
        fontSize: 24,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    expenseMeta: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    expenseAmount: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.coral,
    },
    footer: {
        paddingTop: Spacing.lg,
    },
    fabContainer: {
        position: 'absolute',
        bottom: Spacing.xl,
        right: Spacing.lg,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.coral,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalContent: {
        flex: 1,
    },
    modalScroll: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    fieldLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.sm + 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.offWhite,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    categoryChipActive: {
        borderColor: Colors.coral,
        backgroundColor: Colors.coral + '15',
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    categoryLabelActive: {
        color: Colors.coral,
    },
    peopleSelectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    addExpenseBtn: {
        marginTop: Spacing.lg,
    },
});
