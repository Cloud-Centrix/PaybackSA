export interface Person {
    id: string;
    name: string;
}

export interface BillItem {
    id: string;
    name: string;
    price: number;
    assignedTo: string[]; // Person IDs
}

export interface Bill {
    id: string;
    name: string;
    paidBy?: Person;
    people: Person[];
    items: BillItem[];
    createdAt: string;
    tip?: number;
    taxIncluded: boolean;
    paidBack?: Record<string, boolean>; // personId -> has paid back
}

export interface PersonShare {
    person: Person;
    items: { name: string; amount: number }[];
    total: number;
}

// Trip types
export interface TripExpense {
    id: string;
    description: string;
    amount: number;
    paidBy: string; // Person ID
    splitAmong: string[]; // Person IDs
    category: ExpenseCategory;
    date: string;
}

export type ExpenseCategory =
    | 'petrol'
    | 'groceries'
    | 'accommodation'
    | 'food'
    | 'activities'
    | 'transport'
    | 'other';

export interface Trip {
    id: string;
    name: string;
    people: Person[];
    expenses: TripExpense[];
    createdAt: string;
    paidBy?: Person;
    paidBack?: Record<string, boolean>; // personId -> has settled
}

export interface Balance {
    from: Person;
    to: Person;
    amount: number;
}

// Settings
export interface UserSettings {
    name: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
}
