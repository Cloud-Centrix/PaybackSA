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
import { useTripStore } from '../../store';
import { Card, EmptyState } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../theme';
import { formatCurrency } from '../../utils/helpers';
import type { Trip } from '../../types';

export function TripsHomeScreen() {
    const navigation = useNavigation<any>();
    const { trips, deleteTrip, setCurrentTrip } = useTripStore();

    const sortedTrips = [...trips].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleNewTrip = () => {
        navigation.navigate('CreateTrip');
    };

    const handleOpenTrip = (trip: Trip) => {
        setCurrentTrip(trip);
        navigation.navigate('TripDetail');
    };

    const handleDeleteTrip = (trip: Trip) => {
        Alert.alert('Delete Trip', `Delete "${trip.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteTrip(trip.id),
            },
        ]);
    };

    const getTripTotal = (trip: Trip) =>
        trip.expenses.reduce((sum, e) => sum + e.amount, 0);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderTrip = ({ item: trip }: { item: Trip }) => (
        <TouchableOpacity onPress={() => handleOpenTrip(trip)} activeOpacity={0.7}>
            <Card style={styles.tripCard}>
                <View style={styles.tripHeader}>
                    <View style={styles.tripIcon}>
                        <Ionicons name="car-outline" size={22} color={Colors.coral} />
                    </View>
                    <View style={styles.tripInfo}>
                        <Text style={styles.tripName} numberOfLines={1}>
                            {trip.name}
                        </Text>
                        <Text style={styles.tripMeta}>
                            {trip.people.length} people · {trip.expenses.length} expenses
                        </Text>
                    </View>
                    <View style={styles.tripRight}>
                        <Text style={styles.tripTotal}>
                            {formatCurrency(getTripTotal(trip))}
                        </Text>
                        <Text style={styles.tripDate}>{formatDate(trip.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDeleteTrip(trip)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteBtn}
                    >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Trip Mode</Text>
                    <Text style={styles.subtitle}>Track group expenses on the go</Text>
                </View>
                <View style={styles.logo}>
                    <Text style={styles.logoText}>🚗</Text>
                </View>
            </View>

            <FlatList
                data={sortedTrips}
                keyExtractor={(item) => item.id}
                renderItem={renderTrip}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyState
                        icon="🏕️"
                        title="No trips yet"
                        subtitle="Start a trip to track shared expenses like petrol, groceries, and accommodation"
                    />
                }
            />

            <View style={styles.fabContainer}>
                <TouchableOpacity style={styles.fab} onPress={handleNewTrip} activeOpacity={0.8}>
                    <Ionicons name="add" size={28} color={Colors.white} />
                    <Text style={styles.fabText}>New Trip</Text>
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
        color: Colors.coral,
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
    tripCard: {
        marginBottom: Spacing.md,
    },
    tripHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tripIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.coral + '12',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    tripInfo: {
        flex: 1,
    },
    tripName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.textPrimary,
    },
    tripMeta: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    tripRight: {
        alignItems: 'flex-end',
        marginRight: Spacing.sm,
    },
    tripTotal: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.coral,
    },
    tripDate: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    deleteBtn: {
        padding: Spacing.xs,
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
        backgroundColor: Colors.coral,
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
