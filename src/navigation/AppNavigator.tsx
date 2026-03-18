import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, FontSize, Shadow } from '../theme';

// Bill screens
import {
    BillsHomeScreen,
    CreateBillScreen,
    ScanReceiptScreen,
    EditItemsScreen,
    AssignItemsScreen,
    BillSummaryScreen,
} from '../screens/bills';

// Trip screens
import {
    TripsHomeScreen,
    CreateTripScreen,
    TripDetailScreen,
} from '../screens/trips';

// Settings
import { SettingsScreen } from '../screens/settings';

const BillStack = createStackNavigator();
const TripStack = createStackNavigator();
const SettingsStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function BillsNavigator() {
    return (
        <BillStack.Navigator screenOptions={{ headerShown: false }}>
            <BillStack.Screen name="BillsHome" component={BillsHomeScreen} />
            <BillStack.Screen name="CreateBill" component={CreateBillScreen} />
            <BillStack.Screen name="ScanReceipt" component={ScanReceiptScreen} />
            <BillStack.Screen name="EditItems" component={EditItemsScreen} />
            <BillStack.Screen name="AssignItems" component={AssignItemsScreen} />
            <BillStack.Screen name="BillSummary" component={BillSummaryScreen} />
        </BillStack.Navigator>
    );
}

function TripsNavigator() {
    return (
        <TripStack.Navigator screenOptions={{ headerShown: false }}>
            <TripStack.Screen name="TripsHome" component={TripsHomeScreen} />
            <TripStack.Screen name="CreateTrip" component={CreateTripScreen} />
            <TripStack.Screen name="TripDetail" component={TripDetailScreen} />
        </TripStack.Navigator>
    );
}

function SettingsNavigator() {
    return (
        <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
        </SettingsStack.Navigator>
    );
}

export function AppNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;
                    switch (route.name) {
                        case 'Bills':
                            iconName = focused ? 'receipt' : 'receipt-outline';
                            break;
                        case 'Trips':
                            iconName = focused ? 'car' : 'car-outline';
                            break;
                        case 'Settings':
                            iconName = focused ? 'settings' : 'settings-outline';
                            break;
                        default:
                            iconName = 'ellipse';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.teal,
                tabBarInactiveTintColor: Colors.textTertiary,
                tabBarLabelStyle: {
                    fontSize: FontSize.xs,
                    fontWeight: '600',
                },
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopColor: Colors.borderLight,
                    paddingTop: 4,
                    paddingBottom: Platform.OS === 'android' ? 44 : 0,
                    height: Platform.OS === 'web' ? 64 : Platform.OS === 'ios' ? 88 : 112,
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 8,
                        },
                        android: {
                            elevation: 8,
                        },
                        default: {},
                    }),
                },
            })}
        >
            <Tab.Screen name="Bills" component={BillsNavigator} />
            <Tab.Screen name="Trips" component={TripsNavigator} />
            <Tab.Screen name="Settings" component={SettingsNavigator} />
        </Tab.Navigator>
    );
}
