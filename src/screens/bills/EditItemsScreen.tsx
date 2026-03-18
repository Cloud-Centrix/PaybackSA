import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBillStore } from '../../store';
import { ScreenHeader, Input, Button, Card } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { formatCurrency, parsePrice } from '../../utils/helpers';
import type { BillItem } from '../../types';

export function EditItemsScreen() {
    const navigation = useNavigation<any>();
    const { currentBill, addItem, updateItem, removeItem } = useBillStore();
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');

    const items = currentBill?.items ?? [];
    const total = items.reduce((sum, item) => sum + item.price, 0);

    const handleAddItem = () => {
        const name = newName.trim();
        const price = parsePrice(newPrice);
        if (!name || price <= 0) return;
        addItem({ name, price, assignedTo: [] });
        setNewName('');
        setNewPrice('');
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        const name = editName.trim();
        const price = parsePrice(editPrice);
        if (!name || price <= 0) return;
        updateItem(editingId, { name, price });
        setEditingId(null);
    };

    const startEdit = (item: BillItem) => {
        setEditingId(item.id);
        setEditName(item.name);
        setEditPrice(item.price.toString());
    };

    const handleDelete = (item: BillItem) => {
        Alert.alert('Remove Item', `Remove "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.id) },
        ]);
    };

    const handleContinue = () => {
        if (items.length === 0) return;
        navigation.navigate('AssignItems');
    };

    const renderItem = ({ item }: { item: BillItem }) => {
        if (editingId === item.id) {
            return (
                <Card style={styles.editCard}>
                    <Input
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Item name"
                        containerStyle={styles.editInput}
                    />
                    <View style={styles.editRow}>
                        <Input
                            value={editPrice}
                            onChangeText={setEditPrice}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            containerStyle={styles.editPriceInput}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                            <Ionicons name="checkmark" size={20} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setEditingId(null)}
                        >
                            <Ionicons name="close" size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </Card>
            );
        }

        return (
            <TouchableOpacity onPress={() => startEdit(item)} activeOpacity={0.7}>
                <Card style={styles.itemCard}>
                    <View style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.name}</Text>
                        </View>
                        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                        <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        </TouchableOpacity>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader
                title="Bill Items"
                subtitle={`${items.length} items · ${formatCurrency(total)}`}
                onBack={() => navigation.goBack()}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <Card style={styles.addCard}>
                            <Text style={styles.addTitle}>Add Item</Text>
                            <View style={styles.addRow}>
                                <Input
                                    placeholder="Item name"
                                    value={newName}
                                    onChangeText={setNewName}
                                    containerStyle={styles.nameInput}
                                />
                                <Input
                                    placeholder="0.00"
                                    value={newPrice}
                                    onChangeText={setNewPrice}
                                    keyboardType="decimal-pad"
                                    containerStyle={styles.priceInput}
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.addBtn,
                                        (!newName.trim() || !newPrice.trim()) && styles.addBtnDisabled,
                                    ]}
                                    onPress={handleAddItem}
                                    disabled={!newName.trim() || !newPrice.trim()}
                                >
                                    <Ionicons name="add" size={20} color={Colors.white} />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📝</Text>
                            <Text style={styles.emptyText}>No items yet</Text>
                            <Text style={styles.emptySubtext}>
                                Add items from the receipt above
                            </Text>
                        </View>
                    }
                />

                <View style={styles.bottomBar}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                    </View>
                    <Button
                        title="Assign Items"
                        onPress={handleContinue}
                        disabled={items.length === 0}
                        icon={<Ionicons name="people" size={20} color={Colors.white} />}
                        style={styles.continueBtn}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    list: {
        padding: Spacing.md,
        paddingBottom: 180,
    },
    addCard: {
        marginBottom: Spacing.lg,
    },
    addTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    nameInput: {
        flex: 2,
        marginBottom: 0,
    },
    priceInput: {
        flex: 1,
        marginBottom: 0,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.coral,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnDisabled: {
        opacity: 0.4,
    },
    itemCard: {
        marginBottom: Spacing.sm,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: FontSize.md,
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
    },
    itemPrice: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
    },
    editCard: {
        marginBottom: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.teal,
    },
    editInput: {
        marginBottom: Spacing.sm,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    editPriceInput: {
        flex: 1,
        marginBottom: 0,
    },
    saveBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.offWhite,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: Spacing.sm,
    },
    emptyText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    emptySubtext: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
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
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    totalLabel: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    totalValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.teal,
    },
    continueBtn: {
        width: '100%',
    },
});
