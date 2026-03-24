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
 * Parse raw OCR text into bill items.
 * Strategy: extract every line that has a price, then filter out
 * totals / tax / payment lines by checking the *name* part only.
 * This avoids false-negatives from aggressive pre-filtering.
 */
export function parseReceiptText(rawText: string): BillItem[] {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const items: BillItem[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 3) continue;

        // Skip lines without any digit (no price possible)
        if (!/\d/.test(trimmed)) continue;

        // Skip separator lines
        if (/^[-=*_]{3,}$/.test(trimmed)) continue;

        // Try to extract name + price
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

/**
 * Try multiple regex patterns to pull an item name and price from a line.
 */
function extractItemAndPrice(
    line: string
): { name: string; price: number } | null {
    // Clean common OCR artifacts
    const cleaned = line
        .replace(/[|]/g, '')
        .replace(/\s{3,}/g, '  ')
        .trim();

    // All patterns look for a Rand amount at/near the end of the line.
    const patterns: RegExp[] = [
        // "Item name    R 45.00"  (2+ space gap)
        /^(.+?)\s{2,}[.…]*\s*R?\s*(\d+[.,]\d{2})\s*$/i,
        // "Item name...R12.50"   (dot leaders)
        /^(.+?)\s*[.…]{2,}\s*R?\s*(\d+[.,]\d{2})\s*$/i,
        // "2 x Burger  89.90"   (quantity prefix)
        /^\d+\s*[xX×]\s*(.+?)\s+R?\s*(\d+[.,]\d{2})\s*$/,
        // "Burger R45.00"       (R prefix mandatory, single space OK)
        /^(.+?)\s+R\s*(\d+[.,]\d{2})\s*$/i,
        // Fallback: anything + space + number.decimal
        /^(.+?)\s+(\d+[.,]\d{2})\s*$/,
    ];

    for (const re of patterns) {
        const m = cleaned.match(re);
        if (m) {
            const result = validateAndReturn(m[1], m[2]);
            if (result) return result;
        }
    }
    return null;
}

/**
 * Clean up the extracted name, parse the price and decide whether
 * this looks like a real menu/product item vs. a total/tax/payment line.
 */
function validateAndReturn(
    rawName: string,
    rawPrice: string
): { name: string; price: number } | null {
    const name = rawName
        .replace(/[.…]+$/, '')          // trailing dots
        .replace(/^\d+\s*[xX×]\s*/, '') // leading "2x "
        .replace(/\s+/g, ' ')           // normalise spaces
        .replace(/^[\s\-*#]+/, '')       // leading dashes / asterisks
        .trim();

    const price = parsePrice(rawPrice);

    // Too short or no price
    if (name.length < 2 || price <= 0) return null;

    // Name is just numbers / codes
    if (/^\d[\d\s/\-]*$/.test(name)) return null;

    // --- Reject names that are clearly NOT menu items ---
    const lower = name.toLowerCase();

    // Exact-match rejects (the entire name is one of these words)
    const exactReject = [
        'total', 'totaal', 'subtotal', 'sub total', 'nett total',
        'grand total', 'vat', 'btw', 'tax', 'change', 'wisselgeld',
        'cash', 'card', 'visa', 'mastercard', 'debit', 'credit',
        'eft', 'balance', 'balans', 'rounding', 'round', 'ronding',
        'amount due', 'amount tendered', 'tender', 'payment',
        'subtotaal', 'incl vat', 'excl vat',
    ];
    if (exactReject.includes(lower)) return null;

    // Starts-with rejects (the name begins with these)
    const startsReject = [
        'total ', 'totaal ', 'subtotal ', 'sub total',
        'vat ', 'tax ', 'change ', 'balance ',
        'amount due', 'amount tendered', 'auth code',
        'ref no', 'reference',
    ];
    if (startsReject.some((p) => lower.startsWith(p))) return null;

    return { name, price };
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
