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
 * Optimised for South African receipts — filters out headers, footers,
 * addresses, VAT lines, totals, payment info, and other non-item text.
 */
export function parseReceiptText(rawText: string): BillItem[] {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const items: BillItem[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip lines that are clearly not items
        if (isNonItemLine(trimmed)) continue;

        // Try to extract an item and price
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
 * Comprehensive filter for non-item lines on SA receipts.
 */
function isNonItemLine(line: string): boolean {
    const lower = line.toLowerCase().trim();

    // Too short to be an item (e.g. "R", "1", "x")
    if (lower.length < 3) return true;

    // Lines that are just numbers, dates, or times
    if (/^\d[\d\s/\-.:,]*$/.test(lower)) return true;

    // Lines that look like dates: 24/03/2026, 2026-03-24, 24 Mar 2026
    if (/\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(lower)) return true;

    // Lines that look like times: 14:30, 2:30 PM
    if (/^\d{1,2}:\d{2}(\s*(am|pm))?\s*$/.test(lower)) return true;

    // Phone numbers
    if (/^[\d\s\+\(\)\-]{7,}$/.test(lower)) return true;

    // Skip patterns — common receipt headers, footers, and metadata
    const skipPatterns = [
        // Store info
        'tax invoice', 'invoice', 'receipt', 'slip', 'docket',
        'store', 'branch', 'shop',
        // Address & contact
        'tel:', 'tel ', 'phone', 'fax', 'address', 'street', 'road',
        'ave ', 'avenue', 'drive', 'centre', 'center', 'mall',
        'www.', 'http', '.co.za', '.com', '@',
        // Tax
        'vat no', 'vat reg', 'vat:', 'tax:', 'incl vat', 'excl vat',
        'vat amount', 'tax total', 'vat total',
        // Totals & subtotals
        'subtotal', 'sub total', 'sub-total', 'nett total',
        'grand total', 'amount due', 'balance due',
        'rounding', 'round',
        // Payment
        'cash', 'card', 'visa', 'mastercard', 'debit', 'credit',
        'eft', 'payment', 'paid', 'tender', 'change due', 'change:',
        'amount tendered', 'auth code', 'ref no', 'reference',
        'transaction', 'approved',
        // Footer
        'thank you', 'thanks', 'please come', 'visit us',
        'welcome', 'enjoy', 'have a',
        // Employee/service
        'server', 'waiter', 'cashier', 'operator', 'served by',
        'table', 'cover', 'seat',
        // Date/time labels
        'date:', 'time:', 'date :', 'time :',
        // Bill structure
        'qty', 'quantity', 'description', 'price', 'amount',
        'item', '----', '====', '****',
        // Discounts
        'discount', 'promo', 'loyalty', 'reward', 'saving',
        // Totals (standalone words)
        'total',
    ];

    if (skipPatterns.some((p) => lower.includes(p))) return true;

    // Skip if line starts with common non-item prefixes
    const skipPrefixes = [
        'reg ', 'reg:', 'till', 'pos ', 'order',
        'check', 'bill no', 'bill:', 'no.', 'no:',
    ];
    if (skipPrefixes.some((p) => lower.startsWith(p))) return true;

    // Skip lines that are all caps and have no numbers (likely headers)
    if (/^[A-Z\s]{10,}$/.test(line.trim()) && !/\d/.test(line)) return true;

    return false;
}

function extractItemAndPrice(
    line: string
): { name: string; price: number } | null {
    // Clean up common OCR artifacts
    const cleaned = line
        .replace(/[|]/g, '')  // pipe chars from column alignment
        .replace(/\s{3,}/g, '  ')  // normalize excessive spaces
        .trim();

    // Pattern 1: "Item name    R 45.00" or "Item name    R45,00" or "Item name  45.00"
    const match1 = cleaned.match(
        /^(.+?)\s{2,}[.…]*\s*R?\s*(\d+[.,]\d{2})\s*$/i
    );
    if (match1) {
        const result = validateAndReturn(match1[1], match1[2]);
        if (result) return result;
    }

    // Pattern 2: "Item name...R12.50" or "Item name ... 12.50" (dot leaders)
    const match2 = cleaned.match(
        /^(.+?)\s*[.…]{2,}\s*R?\s*(\d+[.,]\d{2})\s*$/i
    );
    if (match2) {
        const result = validateAndReturn(match2[1], match2[2]);
        if (result) return result;
    }

    // Pattern 3: "2 x Burger  89.90" or "2x Burger  89.90" (quantity prefix)
    const match3 = cleaned.match(
        /^\d+\s*[xX×]\s*(.+?)\s{2,}R?\s*(\d+[.,]\d{2})\s*$/
    );
    if (match3) {
        const result = validateAndReturn(match3[1], match3[2]);
        if (result) return result;
    }

    // Pattern 4: "Burger R45.00" (single space + R prefix, must have R)
    const match4 = cleaned.match(
        /^(.+?)\s+R\s*(\d+[.,]\d{2})\s*$/i
    );
    if (match4) {
        const result = validateAndReturn(match4[1], match4[2]);
        if (result) return result;
    }

    // Pattern 5: Fallback — anything followed by a number at end
    const match5 = cleaned.match(/^(.+?)\s+(\d+[.,]\d{2})\s*$/);
    if (match5) {
        const result = validateAndReturn(match5[1], match5[2]);
        if (result) return result;
    }

    return null;
}

function validateAndReturn(
    rawName: string,
    rawPrice: string
): { name: string; price: number } | null {
    const name = rawName
        .replace(/[.…]+$/, '')      // trailing dots
        .replace(/^\d+\s*[xX×]\s*/, '') // leading quantity "2x "
        .replace(/\s+/g, ' ')       // normalize spaces
        .replace(/^[\s\-*#]+/, '')   // leading dashes/asterisks
        .trim();

    const price = parsePrice(rawPrice);

    // Name must be at least 2 chars and price must be reasonable (R0.50 - R9999)
    if (name.length < 2 || price <= 0 || price > 9999) return null;

    // Skip if name is just numbers
    if (/^\d+$/.test(name)) return null;

    // Skip if name looks like a total/subtotal that slipped through
    const lowerName = name.toLowerCase();
    if (['total', 'subtotal', 'vat', 'tax', 'change', 'cash', 'card'].includes(lowerName)) {
        return null;
    }

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
