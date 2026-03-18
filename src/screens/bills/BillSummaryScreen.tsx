import React, { useState, useMemo } from 'react';
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
import { useBillStore, useSettingsStore } from '../../store';
import { ScreenHeader, Button, Card, Input } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../theme';
import { formatCurrency } from '../../utils/helpers';
import { calculateShares } from '../../utils/calculator';
import {
    generateShareMessage,
    generateGroupShareMessage,
    shareViaWhatsApp,
    shareViaEmail,
    shareNative,
} from '../../utils/sharing';
import type { PersonShare } from '../../types';

export function BillSummaryScreen() {
    const navigation = useNavigation<any>();
    const { currentBill, setTip, saveBill, togglePaidBack } = useBillStore();
    const { settings } = useSettingsStore();
    const [tipInput, setTipInput] = useState(
        currentBill?.tip?.toString() || ''
    );
    const [shareTarget, setShareTarget] = useState<PersonShare | null>(null);
    const [showBalances, setShowBalances] = useState(false);

    const shares = useMemo(() => {
        if (!currentBill) return [];
        return calculateShares(currentBill);
    }, [currentBill]);

    const itemsTotal = currentBill?.items.reduce((s, i) => s + i.price, 0) ?? 0;
    const tipAmount = currentBill?.tip ?? 0;
    const grandTotal = itemsTotal + tipAmount;

    const handleTipChange = (text: string) => {
        setTipInput(text);
        const val = parseFloat(text);
        if (!isNaN(val) && val >= 0) {
            setTip(Math.round(val * 100) / 100);
        } else if (text === '') {
            setTip(0);
        }
    };

    const handleSave = () => {
        saveBill();
        Alert.alert('Saved!', 'Bill has been saved.', [
            { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
    };

    const handleShare = (share: PersonShare, method: 'whatsapp' | 'email' | 'native') => {
        if (!currentBill) return;
        const paidByName = currentBill.paidBy?.name ?? 'Unknown';
        const message = generateShareMessage(currentBill.name, share, paidByName, settings);
        switch (method) {
            case 'whatsapp':
                shareViaWhatsApp(message);
                break;
            case 'email':
                shareViaEmail(message, `Your share of ${currentBill.name}`);
                break;
            default:
                shareNative(message);
        }
        setShareTarget(null);
    };

    const handleGroupShare = () => {
        if (!currentBill) return;
        const paidByName = currentBill.paidBy?.name ?? 'Unknown';
        const message = generateGroupShareMessage(
            currentBill.name,
            shares,
            paidByName,
            grandTotal,
            settings,
            currentBill.paidBack
        );
        shareViaWhatsApp(message);
    };

    const renderShare = ({ item: share }: { item: PersonShare }) => {
        const initials = share.person.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        const isPaid = currentBill?.paidBack?.[share.person.id] ?? false;

        return (
            <Card style={isPaid ? { ...styles.shareCard, ...styles.shareCardPaid } : styles.shareCard}>
                <View style={styles.shareHeader}>
                    <TouchableOpacity
                        onPress={() => togglePaidBack(share.person.id)}
                        activeOpacity={0.7}
                        style={styles.paidToggle}
                    >
                        <Ionicons
                            name={isPaid ? 'checkmark-circle' : 'ellipse-outline'}
                            size={28}
                            color={isPaid ? '#25D366' : Colors.textTertiary}
                        />
                    </TouchableOpacity>
                    <View style={[styles.avatar, isPaid && styles.avatarPaid]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.shareInfo}>
                        <Text style={[styles.shareName, isPaid && styles.shareNamePaid]}>
                            {share.person.name}
                        </Text>
                        <Text style={styles.shareItemCount}>
                            {isPaid ? '✅ Paid' : `${share.items.length} item${share.items.length !== 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <Text style={[styles.shareTotal, isPaid && styles.shareTotalPaid]}>
                        {formatCurrency(share.total)}
                    </Text>
                </View>

                {share.items.map((item, idx) => (
                    <View key={idx} style={styles.shareItem}>
                        <Text style={styles.shareItemName}>{item.name}</Text>
                        <Text style={styles.shareItemAmount}>
                            {formatCurrency(item.amount)}
                        </Text>
                    </View>
                ))}

                <View style={styles.shareActions}>
                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => handleShare(share, 'whatsapp')}
                    >
                        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                        <Text style={[styles.shareBtnText, { color: '#25D366' }]}>
                            WhatsApp
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => handleShare(share, 'email')}
                    >
                        <Ionicons name="mail-outline" size={18} color={Colors.teal} />
                        <Text style={[styles.shareBtnText, { color: Colors.teal }]}>
                            Email
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => handleShare(share, 'native')}
                    >
                        <Ionicons name="share-outline" size={18} color={Colors.coral} />
                        <Text style={[styles.shareBtnText, { color: Colors.coral }]}>
                            Share
                        </Text>
                    </TouchableOpacity>
                </View>
            </Card>
        );
    };

    if (!currentBill) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScreenHeader title="Summary" onBack={() => navigation.goBack()} />
                <View style={styles.centered}>
                    <Text>No bill selected</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader
                title={currentBill.name}
                subtitle="Summary"
                onBack={() => navigation.goBack()}
            />

            <FlatList
                data={shares}
                keyExtractor={(item) => item.person.id}
                renderItem={renderShare}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View>
                        {/* Paid By */}
                        {currentBill.paidBy && (
                            <Card style={styles.paidByCard}>
                                <Ionicons name="card-outline" size={20} color={Colors.teal} />
                                <Text style={styles.paidByLabel}>Paid by</Text>
                                <Text style={styles.paidByName}>{currentBill.paidBy.name}</Text>
                            </Card>
                        )}

                        {/* Totals Card */}
                        <Card style={styles.totalsCard}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Items</Text>
                                <Text style={styles.totalValue}>
                                    {formatCurrency(itemsTotal)}
                                </Text>
                            </View>
                            <View style={styles.tipRow}>
                                <Text style={styles.totalLabel}>Tip</Text>
                                <Input
                                    value={tipInput}
                                    onChangeText={handleTipChange}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    containerStyle={styles.tipInput}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.grandLabel}>Grand Total</Text>
                                <Text style={styles.grandValue}>
                                    {formatCurrency(grandTotal)}
                                </Text>
                            </View>
                        </Card>

                        {/* Who Owes Who */}
                        {currentBill.paidBy && shares.length > 0 && (
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
                                    shares
                                        .filter((s) => s.person.id !== currentBill.paidBy?.id)
                                        .map((s) => {
                                            const isPaid = currentBill.paidBack?.[s.person.id] ?? false;
                                            return (
                                                <View key={s.person.id} style={[styles.balanceRow, isPaid && styles.balanceRowPaid]}>
                                                    <Text style={[styles.balanceFrom, isPaid && styles.balanceTextPaid]}>{s.person.name}</Text>
                                                    <Ionicons name="arrow-forward" size={14} color={Colors.textTertiary} />
                                                    <Text style={[styles.balanceTo, isPaid && styles.balanceTextPaid]}>{currentBill.paidBy!.name}</Text>
                                                    <Text style={[styles.balanceAmount, isPaid && styles.balanceAmountPaid]}>
                                                        {formatCurrency(s.total)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                            </Card>
                        )}

                        <Text style={styles.sectionTitle}>Each Person Owes</Text>
                    </View>
                }
                ListFooterComponent={
                    <View>
                        <Button
                            title="Share Summary to Group"
                            onPress={handleGroupShare}
                            variant="outline"
                            icon={<Ionicons name="logo-whatsapp" size={20} color="#25D366" />}
                            style={styles.groupShareBtn}
                        />
                        <Button
                            title="Save Bill"
                            onPress={handleSave}
                            icon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
                            style={styles.saveBtn}
                        />
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    totalsCard: {
        marginBottom: Spacing.lg,
        backgroundColor: Colors.teal,
        padding: Spacing.lg,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    totalLabel: {
        fontSize: FontSize.md,
        color: Colors.white + 'CC',
    },
    totalValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.white,
    },
    tipInput: {
        width: 100,
        marginBottom: 0,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.white + '30',
        marginVertical: Spacing.md,
    },
    grandLabel: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    grandValue: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    shareCard: {
        marginBottom: Spacing.md,
    },
    shareCardPaid: {
        opacity: 0.7,
        borderColor: '#25D366',
        borderWidth: 1,
    },
    shareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    paidToggle: {
        marginRight: Spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.coral,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    avatarPaid: {
        backgroundColor: '#25D366',
    },
    avatarText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    shareInfo: {
        flex: 1,
    },
    shareName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    shareNamePaid: {
        textDecorationLine: 'line-through',
        color: Colors.textTertiary,
    },
    shareItemCount: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    shareTotal: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
    },
    shareTotalPaid: {
        color: '#25D366',
        textDecorationLine: 'line-through',
    },
    shareItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingLeft: 52,
    },
    shareItemName: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    shareItemAmount: {
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
    saveBtn: {
        marginTop: Spacing.sm,
    },
    groupShareBtn: {
        marginTop: Spacing.lg,
        borderColor: '#25D366',
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
        color: Colors.teal,
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
});
