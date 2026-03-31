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
import { useTripStore, usePremiumStore } from '../../store';
import { ScreenHeader, Input, Button, PersonChip, Card, PremiumGate } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { FREE_PERSON_LIMIT } from '../../types';
import type { Person } from '../../types';

export function CreateTripScreen() {
    const navigation = useNavigation<any>();
    const { createTrip, currentTrip, addPerson, removePerson, setTripPaidBy } = useTripStore();
    const [tripName, setTripName] = useState('');
    const [personName, setPersonName] = useState('');
    const [step, setStep] = useState<'name' | 'people' | 'payer'>('name');
    const { canAddPerson } = usePremiumStore();
    const [showPremiumGate, setShowPremiumGate] = useState(false);
    const [premiumFeature, setPremiumFeature] = useState('');

    const handleNameSubmit = () => {
        if (!tripName.trim()) return;
        createTrip(tripName.trim());
        setStep('people');
    };

    const handleAddPerson = () => {
        if (!personName.trim()) return;
        if (!canAddPerson(currentTrip?.people.length ?? 0)) {
            setPremiumFeature(`Adding more than ${FREE_PERSON_LIMIT} people`);
            setShowPremiumGate(true);
            return;
        }
        addPerson(personName.trim());
        setPersonName('');
    };

    const handleContinue = () => {
        if (!currentTrip || currentTrip.people.length < 2) return;
        setStep('payer');
    };

    const handleSelectPayer = (person: Person) => {
        setTripPaidBy(person);
    };

    const handlePayerContinue = () => {
        if (!currentTrip?.paidBy) return;
        navigation.navigate('TripDetail');
    };

    if (step === 'name') {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <PremiumGate visible={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature={premiumFeature} />
                <ScreenHeader title="New Trip" onBack={() => navigation.goBack()} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.centered}>
                        <Text style={styles.emoji}>🏕️</Text>
                        <Text style={styles.heading}>Name your trip</Text>
                        <Text style={styles.description}>
                            Track shared expenses for your group
                        </Text>
                        <Input
                            placeholder='e.g. "Weekend at Drakensberg"'
                            value={tripName}
                            onChangeText={setTripName}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleNameSubmit}
                            containerStyle={styles.input}
                        />
                        <Button
                            title="Continue"
                            onPress={handleNameSubmit}
                            disabled={!tripName.trim()}
                            variant="secondary"
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
                    title={currentTrip?.name || 'New Trip'}
                    subtitle="Who's paying?"
                    onBack={() => setStep('people')}
                />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.sectionTitle}>Who's the main payer?</Text>
                    <Text style={styles.sectionSub}>
                        Select who is mostly covering costs
                    </Text>

                    {currentTrip?.people.map((person) => {
                        const isSelected = currentTrip?.paidBy?.id === person.id;
                        return (
                            <TouchableOpacity
                                key={person.id}
                                style={[styles.payerOption, isSelected && styles.payerOptionSelected]}
                                onPress={() => handleSelectPayer(person)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.payerAvatar, isSelected && styles.payerAvatarSelected]}>
                                    <Text style={[styles.payerAvatarText, isSelected && styles.payerAvatarTextSelected]}>
                                        {(person.name?.[0] ?? '?').toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.payerName, isSelected && styles.payerNameSelected]}>
                                    {person.name}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.coral} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.bottomBar}>
                    <Button
                        title="Start Trip"
                        onPress={handlePayerContinue}
                        variant="secondary"
                        disabled={!currentTrip?.paidBy}
                        icon={<Ionicons name="airplane" size={20} color={Colors.white} />}
                        style={styles.continueButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <PremiumGate visible={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature={premiumFeature} />
            <ScreenHeader
                title={currentTrip?.name || 'New Trip'}
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
                    <Text style={styles.sectionTitle}>Who's on the trip?</Text>
                    <Text style={styles.sectionSub}>Add at least 2 people</Text>

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
                        {currentTrip?.people.map((person) => (
                            <PersonChip
                                key={person.id}
                                name={person.name}
                                onRemove={() => removePerson(person.id)}
                            />
                        ))}
                    </View>

                    {(currentTrip?.people.length ?? 0) > 0 && (
                        <Card style={styles.summaryCard}>
                            <Ionicons name="people" size={20} color={Colors.coral} />
                            <Text style={styles.summaryText}>
                                {currentTrip!.people.length} people added
                            </Text>
                        </Card>
                    )}
                </ScrollView>

                <View style={styles.bottomBar}>
                    <Button
                        title="Start Trip"
                        onPress={handleContinue}
                        variant="secondary"
                        disabled={(currentTrip?.people.length ?? 0) < 2}
                        icon={<Ionicons name="airplane" size={20} color={Colors.white} />}
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
        paddingBottom: 160,
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
        backgroundColor: Colors.coral,
        alignItems: 'center',
        justifyContent: 'center',
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
    continueButton: {
        width: '100%',
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
        color: Colors.coral,
        fontWeight: FontWeight.medium,
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
        borderColor: Colors.coral,
        backgroundColor: Colors.coral + '08',
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
        backgroundColor: Colors.coral,
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
        color: Colors.coral,
    },
});
