import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bill, BillItem, Person } from '../types';
import { generateId } from '../utils/helpers';

interface BillStore {
    bills: Bill[];
    currentBill: Bill | null;

    // Actions
    createBill: (name: string) => void;
    deleteBill: (id: string) => void;
    setCurrentBill: (bill: Bill | null) => void;
    setPaidBy: (person: Person) => void;

    // People
    addPerson: (name: string) => void;
    removePerson: (id: string) => void;

    // Items
    addItem: (item: Omit<BillItem, 'id'>) => void;
    updateItem: (id: string, updates: Partial<BillItem>) => void;
    removeItem: (id: string) => void;
    setItems: (items: BillItem[]) => void;

    // Assignment
    toggleAssignment: (itemId: string, personId: string) => void;
    assignAllToEveryone: () => void;

    // Tip
    setTip: (amount: number) => void;

    // Payment tracking
    togglePaidBack: (personId: string) => void;

    // Finalize
    saveBill: () => void;
}

export const useBillStore = create<BillStore>()(
    persist(
        (set, get) => ({
            bills: [],
            currentBill: null,

            createBill: (name: string) => {
                const bill: Bill = {
                    id: generateId(),
                    name,
                    people: [],
                    items: [],
                    createdAt: new Date().toISOString(),
                    tip: 0,
                    taxIncluded: true,
                };
                set({ currentBill: bill });
            },

            deleteBill: (id: string) => {
                set((state) => ({
                    bills: state.bills.filter((b) => b.id !== id),
                    currentBill: state.currentBill?.id === id ? null : state.currentBill,
                }));
            },

            setCurrentBill: (bill) => set({ currentBill: bill }),

            setPaidBy: (person: Person) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    return {
                        currentBill: { ...state.currentBill, paidBy: person },
                    };
                });
            },

            addPerson: (name: string) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    const person: Person = { id: generateId(), name };
                    return {
                        currentBill: {
                            ...state.currentBill,
                            people: [...state.currentBill.people, person],
                        },
                    };
                });
            },

            removePerson: (id: string) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    return {
                        currentBill: {
                            ...state.currentBill,
                            people: state.currentBill.people.filter((p) => p.id !== id),
                            items: state.currentBill.items.map((item) => ({
                                ...item,
                                assignedTo: item.assignedTo.filter((pid) => pid !== id),
                            })),
                        },
                    };
                });
            },

            addItem: (item) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    const newItem: BillItem = { ...item, id: generateId() };
                    return {
                        currentBill: {
                            ...state.currentBill,
                            items: [...state.currentBill.items, newItem],
                        },
                    };
                });
            },

            updateItem: (id, updates) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    return {
                        currentBill: {
                            ...state.currentBill,
                            items: state.currentBill.items.map((item) =>
                                item.id === id ? { ...item, ...updates } : item
                            ),
                        },
                    };
                });
            },

            removeItem: (id) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    return {
                        currentBill: {
                            ...state.currentBill,
                            items: state.currentBill.items.filter((item) => item.id !== id),
                        },
                    };
                });
            },

            setItems: (items) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    return {
                        currentBill: { ...state.currentBill, items },
                    };
                });
            },

            toggleAssignment: (itemId, personId) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    return {
                        currentBill: {
                            ...state.currentBill,
                            items: state.currentBill.items.map((item) => {
                                if (item.id !== itemId) return item;
                                const assigned = item.assignedTo.includes(personId);
                                return {
                                    ...item,
                                    assignedTo: assigned
                                        ? item.assignedTo.filter((id) => id !== personId)
                                        : [...item.assignedTo, personId],
                                };
                            }),
                        },
                    };
                });
            },

            assignAllToEveryone: () => {
                set((state) => {
                    if (!state.currentBill) return state;
                    const allPeopleIds = state.currentBill.people.map((p) => p.id);
                    return {
                        currentBill: {
                            ...state.currentBill,
                            items: state.currentBill.items.map((item) => ({
                                ...item,
                                assignedTo: allPeopleIds,
                            })),
                        },
                    };
                });
            },

            setTip: (amount) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    return {
                        currentBill: { ...state.currentBill, tip: amount },
                    };
                });
            },

            togglePaidBack: (personId: string) => {
                set((state) => {
                    if (!state.currentBill) return state;
                    const current = state.currentBill.paidBack ?? {};
                    const updated = { ...current, [personId]: !current[personId] };
                    return {
                        currentBill: { ...state.currentBill, paidBack: updated },
                    };
                });
            },

            saveBill: () => {
                set((state) => {
                    if (!state.currentBill) return state;
                    const existing = state.bills.findIndex(
                        (b) => b.id === state.currentBill!.id
                    );
                    const updatedBills =
                        existing >= 0
                            ? state.bills.map((b) =>
                                b.id === state.currentBill!.id ? state.currentBill! : b
                            )
                            : [...state.bills, state.currentBill!];
                    return { bills: updatedBills };
                });
            },
        }),
        {
            name: 'paybacksa-bills',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
