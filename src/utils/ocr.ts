import { BillItem } from '../types';
import { generateId, parsePrice } from './helpers';

/**
 * Parse raw OCR text lines into bill items.
 * Handles common receipt formats:
 *   - "Item name    R12.50"
 *   - "2x Item      25.00"
 *   - "Item name ... 12.50"
 */
export function parseReceiptText(rawText: string): BillItem[] {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const items: BillItem[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip common header/footer lines
        if (isHeaderOrFooter(trimmed)) continue;

        // Try to extract an item and price from each line
        const parsed = extractItemAndPrice(trimmed);
        if (parsed) {
            items.push({
                id: generateId(),
                name: parsed.name,
                price: parsed.price,
                assignedTo: [],
            });
        }
    }

    return items;
}

function isHeaderOrFooter(line: string): boolean {
    const lower = line.toLowerCase();
    const skipPatterns = [
        'tax invoice',
        'vat',
        'subtotal',
        'sub total',
        'total',
        'change',
        'cash',
        'card',
        'visa',
        'mastercard',
        'thank you',
        'tel:',
        'tel ',
        'phone',
        'address',
        'receipt',
        'invoice',
        'date:',
        'time:',
        'table',
        'server',
        'waiter',
        'cashier',
        'payment',
        'balance',
    ];
    return skipPatterns.some((p) => lower.includes(p));
}

function extractItemAndPrice(
    line: string
): { name: string; price: number } | null {
    // Pattern: capture everything before the last number on the line
    // Matches: "Burger     R45.00", "Coke 2x   25.00", "Pizza...35.50"
    const match = line.match(
        /^(.+?)\s*[.…]*\s*R?\s*(\d+[.,]\d{2})\s*$/i
    );

    if (match) {
        const name = match[1]
            .replace(/[.…]+$/, '')
            .replace(/\s+/g, ' ')
            .trim();
        const price = parsePrice(match[2]);
        if (name.length > 0 && price > 0) {
            return { name, price };
        }
    }

    // Fallback: try to find any price-like number
    const fallback = line.match(/^(.+?)\s+(\d+[.,]\d{2})\s*$/);
    if (fallback) {
        const name = fallback[1].replace(/\s+/g, ' ').trim();
        const price = parsePrice(fallback[2]);
        if (name.length > 1 && price > 0) {
            return { name, price };
        }
    }

    return null;
}

/**
 * Simulate OCR for development. In production, this would call
 * a real OCR API or use on-device ML.
 */
export function simulateOCR(): BillItem[] {
    return [
        { id: generateId(), name: 'Burger', price: 89.9, assignedTo: [] },
        { id: generateId(), name: 'Pizza Margherita', price: 75.0, assignedTo: [] },
        { id: generateId(), name: 'Coca-Cola', price: 28.0, assignedTo: [] },
        { id: generateId(), name: 'Fries', price: 35.0, assignedTo: [] },
        { id: generateId(), name: 'Sparkling Water', price: 22.0, assignedTo: [] },
        { id: generateId(), name: 'Chocolate Brownie', price: 55.0, assignedTo: [] },
    ];
}
