import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip, TripExpense, Person, Balance } from '../types';
import { generateId } from '../utils/helpers';

interface TripStore {
    trips: Trip[];
    currentTrip: Trip | null;

    createTrip: (name: string) => void;
    deleteTrip: (id: string) => void;
    setCurrentTrip: (trip: Trip | null) => void;

    addPerson: (name: string) => void;
    removePerson: (id: string) => void;
    setTripPaidBy: (person: Person) => void;

    addExpense: (expense: Omit<TripExpense, 'id'>) => void;
    updateExpense: (id: string, updates: Partial<TripExpense>) => void;
    removeExpense: (id: string) => void;

    togglePaidBack: (personId: string) => void;

    saveTrip: () => void;
}

export const useTripStore = create<TripStore>()(
    persist(
        (set, get) => ({
            trips: [],
            currentTrip: null,

            createTrip: (name) => {
                const trip: Trip = {
                    id: generateId(),
                    name,
                    people: [],
                    expenses: [],
                    createdAt: new Date().toISOString(),
                };
                set({ currentTrip: trip });
            },

            deleteTrip: (id) => {
                set((state) => ({
                    trips: state.trips.filter((t) => t.id !== id),
                    currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
                }));
            },

            setCurrentTrip: (trip) => set({ currentTrip: trip }),

            setTripPaidBy: (person) => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    return {
                        currentTrip: { ...state.currentTrip, paidBy: person },
                    };
                });
            },

            addPerson: (name) => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    return {
                        currentTrip: {
                            ...state.currentTrip,
                            people: [...state.currentTrip.people, { id: generateId(), name }],
                        },
                    };
                });
            },

            removePerson: (id) => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    return {
                        currentTrip: {
                            ...state.currentTrip,
                            people: state.currentTrip.people.filter((p) => p.id !== id),
                            expenses: state.currentTrip.expenses
                                .map((e) => ({
                                    ...e,
                                    splitAmong: e.splitAmong.filter((pid) => pid !== id),
                                }))
                                .filter((e) => e.paidBy !== id),
                        },
                    };
                });
            },

            addExpense: (expense) => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    return {
                        currentTrip: {
                            ...state.currentTrip,
                            expenses: [
                                ...state.currentTrip.expenses,
                                { ...expense, id: generateId() },
                            ],
                        },
                    };
                });
            },

            updateExpense: (id, updates) => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    return {
                        currentTrip: {
                            ...state.currentTrip,
                            expenses: state.currentTrip.expenses.map((e) =>
                                e.id === id ? { ...e, ...updates } : e
                            ),
                        },
                    };
                });
            },

            removeExpense: (id) => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    return {
                        currentTrip: {
                            ...state.currentTrip,
                            expenses: state.currentTrip.expenses.filter((e) => e.id !== id),
                        },
                    };
                });
            },

            togglePaidBack: (personId: string) => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    const current = state.currentTrip.paidBack ?? {};
                    const updated = { ...current, [personId]: !current[personId] };
                    return {
                        currentTrip: { ...state.currentTrip, paidBack: updated },
                    };
                });
            },

            saveTrip: () => {
                set((state) => {
                    if (!state.currentTrip) return state;
                    const existing = state.trips.findIndex(
                        (t) => t.id === state.currentTrip!.id
                    );
                    const updatedTrips =
                        existing >= 0
                            ? state.trips.map((t) =>
                                t.id === state.currentTrip!.id ? state.currentTrip! : t
                            )
                            : [...state.trips, state.currentTrip!];
                    return { trips: updatedTrips };
                });
            },
        }),
        {
            name: 'paybacksa-trips',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Calculate trip balances (who owes whom)
export function calculateBalances(trip: Trip): Balance[] {
    const netAmounts = new Map<string, number>();

    trip.people.forEach((p) => netAmounts.set(p.id, 0));

    trip.expenses.forEach((expense) => {
        const sharePerPerson = expense.amount / expense.splitAmong.length;

        // Person who paid is owed money
        const currentPaidBy = netAmounts.get(expense.paidBy) ?? 0;
        netAmounts.set(expense.paidBy, currentPaidBy + expense.amount);

        // Each person who shares the expense owes their share
        expense.splitAmong.forEach((personId) => {
            const current = netAmounts.get(personId) ?? 0;
            netAmounts.set(personId, current - sharePerPerson);
        });
    });

    // Settle debts: greedy algorithm
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    netAmounts.forEach((amount, id) => {
        if (amount < -0.01) debtors.push({ id, amount: -amount });
        else if (amount > 0.01) creditors.push({ id, amount });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const balances: Balance[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
        if (settleAmount > 0.01) {
            const fromPerson = trip.people.find((p) => p.id === debtors[i].id)!;
            const toPerson = trip.people.find((p) => p.id === creditors[j].id)!;
            balances.push({
                from: fromPerson,
                to: toPerson,
                amount: Math.round(settleAmount * 100) / 100,
            });
        }
        debtors[i].amount -= settleAmount;
        creditors[j].amount -= settleAmount;
        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }

    return balances;
}
