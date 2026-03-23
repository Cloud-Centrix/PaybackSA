import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBillStore, usePremiumStore } from '../../store';

const FREE_PERSON_LIMIT = 3;
import { ScreenHeader, Input, Button, PersonChip, Card, PremiumGate } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import type { Person } from '../../types';

export function CreateBillScreen() {
    const navigation = useNavigation<any>();
    const { createBill, currentBill, addPerson, removePerson, setPaidBy } = useBillStore();
    const [billName, setBillName] = useState('');
    const [personName, setPersonName] = useState('');
    const [step, setStep] = useState<'name' | 'people' | 'payer'>('name');
    const { isPremium, canAddPerson } = usePremiumStore();
    const [showPremiumGate, setShowPremiumGate] = useState(false);
    const [premiumFeature, setPremiumFeature] = useState('');

    const handleNameSubmit = () => {
        if (!billName.trim()) return;
        createBill(billName.trim());
        setStep('people');
    };

    const handleAddPerson = () => {
        if (!personName.trim()) return;
        if (!canAddPerson(currentBill?.people.length ?? 0)) {
            setPremiumFeature(`Adding more than ${FREE_PERSON_LIMIT} people`);
            setShowPremiumGate(true);
            return;
        }
        addPerson(personName.trim());
        setPersonName('');
    };

    const handleContinue = () => {
        if (!currentBill || currentBill.people.length === 0) return;
        setStep('payer');
    };

    const handleSelectPayer = (person: Person) => {
        setPaidBy(person);
    };

    const handlePayerContinue = (target: 'scan' | 'manual') => {
        if (!currentBill?.paidBy) return;
        if (target === 'scan') {
            if (!isPremium) {
                setPremiumFeature('OCR receipt scanning');
                setShowPremiumGate(true);
                return;
            }
            navigation.navigate('ScanReceipt');
        } else {
            navigation.navigate('EditItems');
        }
    };

    if (step === 'name') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <PremiumGate visible={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature={premiumFeature} />
                <ScreenHeader title="New Bill" onBack={() => navigation.goBack()} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.centered}>
                        <Text style={styles.emoji}>🧾</Text>
                        <Text style={styles.heading}>Name your bill</Text>
                        <Text style={styles.description}>
                            Give it a name so you can find it later
                        </Text>
                        <Input
                            placeholder='e.g. "Dinner at Spur"'
                            value={billName}
                            onChangeText={setBillName}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleNameSubmit}
                            containerStyle={styles.input}
                        />
                        <Button
                            title="Continue"
                            onPress={handleNameSubmit}
                            disabled={!billName.trim()}
                            style={styles.button}
                        />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    if (step === 'payer') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <PremiumGate visible={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature={premiumFeature} />
                <ScreenHeader
                    title={currentBill?.name || 'New Bill'}
                    subtitle="Who paid?"
                    onBack={() => setStep('people')}
                />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.sectionTitle}>Who paid the bill?</Text>
                    <Text style={styles.sectionSub}>
                        Select the person who paid
                    </Text>

                    {currentBill?.people.map((person) => {
                        const isSelected = currentBill?.paidBy?.id === person.id;
                        return (
                            <TouchableOpacity
                                key={person.id}
                                style={[styles.payerOption, isSelected && styles.payerOptionSelected]}
                                onPress={() => handleSelectPayer(person)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.payerAvatar, isSelected && styles.payerAvatarSelected]}>
                                    <Text style={[styles.payerAvatarText, isSelected && styles.payerAvatarTextSelected]}>
                                        {person.name[0].toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.payerName, isSelected && styles.payerNameSelected]}>
                                    {person.name}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.teal} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.bottomBar}>
                    <Button
                        title={isPremium ? 'Scan Receipt' : 'Scan Receipt 🔒'}
                        onPress={() => handlePayerContinue('scan')}
                        disabled={!currentBill?.paidBy}
                        icon={<Ionicons name="camera" size={20} color={Colors.white} />}
                        style={styles.continueButton}
                    />
                    <Button
                        title="Add Items Manually"
                        onPress={() => handlePayerContinue('manual')}
                        variant="outline"
                        disabled={!currentBill?.paidBy}
                        style={styles.manualButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <PremiumGate visible={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature={premiumFeature} />
            <ScreenHeader
                title={currentBill?.name || 'New Bill'}
                subtitle="Add people"
                onBack={() => setStep('name')}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.sectionTitle}>Who's splitting?</Text>
                    <Text style={styles.sectionSub}>
                        Add everyone at the table
                    </Text>

                    <View style={styles.addRow}>
                        <Input
                            placeholder="Name"
                            value={personName}
                            onChangeText={setPersonName}
                            returnKeyType="done"
                            onSubmitEditing={handleAddPerson}
                            containerStyle={styles.personInput}
                        />
                        <TouchableOpacity
                            style={[
                                styles.addButton,
                                !personName.trim() && styles.addButtonDisabled,
                            ]}
                            onPress={handleAddPerson}
                            disabled={!personName.trim()}
                        >
                            <Ionicons name="add" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.peopleList}>
                        {currentBill?.people.map((person) => (
                            <PersonChip
                                key={person.id}
                                name={person.name}
                                onRemove={() => removePerson(person.id)}
                            />
                        ))}
                    </View>

                    {(currentBill?.people.length ?? 0) > 0 && (
                        <Card style={styles.summaryCard}>
                            <Ionicons name="people" size={20} color={Colors.teal} />
                            <Text style={styles.summaryText}>
                                {currentBill!.people.length} people added
                            </Text>
                        </Card>
                    )}
                </ScrollView>

                <View style={styles.bottomBar}>
                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        disabled={(currentBill?.people.length ?? 0) === 0}
                        icon={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
                        style={styles.continueButton}
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
    content: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emoji: {
        fontSize: 56,
        marginBottom: Spacing.md,
    },
    heading: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    input: {
        width: '100%',
    },
    button: {
        width: '100%',
        marginTop: Spacing.sm,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 200,
    },
    sectionTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    sectionSub: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    personInput: {
        flex: 1,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.teal,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
    },
    addButtonDisabled: {
        opacity: 0.4,
    },
    peopleList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
        paddingVertical: Spacing.sm + 2,
    },
    summaryText: {
        fontSize: FontSize.sm,
        color: Colors.teal,
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
        gap: Spacing.sm,
    },
    continueButton: {
        width: '100%',
    },
    manualButton: {
        width: '100%',
    },
    payerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.white,
        marginBottom: Spacing.sm,
        borderWidth: 2,
        borderColor: Colors.borderLight,
    },
    payerOptionSelected: {
        borderColor: Colors.teal,
        backgroundColor: Colors.teal + '08',
    },
    payerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.offWhite,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    payerAvatarSelected: {
        backgroundColor: Colors.teal,
    },
    payerAvatarText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textSecondary,
    },
    payerAvatarTextSelected: {
        color: Colors.white,
    },
    payerName: {
        flex: 1,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        color: Colors.textPrimary,
    },
    payerNameSelected: {
        fontWeight: FontWeight.bold,
        color: Colors.teal,
    },
});
