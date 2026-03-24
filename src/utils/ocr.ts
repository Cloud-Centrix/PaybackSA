import { BillItem } from '../types';
import { generateId, parsePrice } from './helpers';
import Constants from 'expo-constants';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Read an image file as base64 using XMLHttpRequest (works on all platforms).
 */
function readImageAsBase64(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Strip the data:image/...;base64, prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = reject;
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
    });
}

/**
 * Send an image to Google Cloud Vision API and return the detected text.
 */
async function callVisionAPI(imageUri: string): Promise<string> {
    const apiKey = Constants.expoConfig?.extra?.googleCloudVisionKey;
    if (!apiKey) {
        throw new Error('Google Cloud Vision API key not configured');
    }

    // Read the image file as base64
    const base64 = await readImageAsBase64(imageUri);

    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: [
                {
                    image: { content: base64 },
                    features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
        throw new Error('No text detected in image');
    }

    // First annotation contains the full detected text
    return textAnnotations[0].description;
}

/**
 * Scan a receipt image and return parsed bill items.
 */
export async function scanReceipt(imageUri: string): Promise<BillItem[]> {
    const rawText = await callVisionAPI(imageUri);
    return parseReceiptText(rawText);
}

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
