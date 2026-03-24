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
 *
 * Handles TWO common SA receipt layouts:
 *
 * **Multi-line** (supermarkets like Spar, Checkers, Pick n Pay, Woolworths):
 *   SASKO WHITE BREAD 700G        ← item name
 *   2 @ 16.99          33.98      ← qty × unit price → line total
 *
 * **Single-line** (restaurants, cafés):
 *   Burger              R89.90
 *
 * Strategy:
 * 1. Walk every line looking for a price at the end.
 * 2. If the line starts with a quantity indicator (e.g. "2 @", "1x"),
 *    grab the item name from the previous non-price line.
 * 3. Otherwise extract the name from the same line.
 * 4. Only reject names that exactly match totals/tax/payment words.
 */
export function parseReceiptText(rawText: string): BillItem[] {
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const items: BillItem[] = [];
    let prevTextLine = ''; // last line that had no extractable price (potential item name)

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip separator lines (---, ===, ***)
        if (/^[-=*_]{3,}$/.test(line)) continue;

        // Try to find a price (R xx.xx or just xx.xx) at the end of the line
        const priceMatch = findTrailingPrice(line);

        if (!priceMatch) {
            // No price on this line → remember it as a potential item name
            prevTextLine = line;
            continue;
        }

        const { textBefore, price } = priceMatch;

        // Decide the item name
        let name = '';

        // Check if this is a quantity line: "2 @ 19.50  39.00" or "1 x Coke  28.00"
        const qtyLine = isQuantityLine(textBefore);
        if (qtyLine) {
            // Item name from the quantity line itself (e.g. "2 x Coke" → "Coke")
            if (qtyLine.inlineName && qtyLine.inlineName.length >= 2) {
                name = qtyLine.inlineName;
            } else {
                // Item name from the **previous** line
                name = prevTextLine;
            }
        } else {
            // Single-line: name and price on the same line
            name = textBefore;
        }

        // Clean up the name
        name = cleanName(name);

        // Validate
        if (name.length >= 2 && price > 0 && !isRejectName(name)) {
            items.push({
                id: generateId(),
                name,
                price,
                assignedTo: [],
            });
        }

        // After extracting a priced line, reset prevTextLine so we don't
        // accidentally reuse a name for the next item.
        prevTextLine = '';
    }

    return items;
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Find a trailing price on a line. Returns the text before the price and
 * the numeric price value. The *last* decimal number on the line wins
 * (handles "2 @ 19.50  39.00" → we want 39.00, which is the line total).
 */
function findTrailingPrice(line: string): { textBefore: string; price: number } | null {
    // Match the LAST occurrence of a price-like number at the end of the line.
    // Accepts optional R prefix: "R39.00", "R 39,00", "39.00"
    const m = line.match(/^(.+?)\s+R?\s*(\d+[.,]\d{2})\s*$/);
    if (!m) return null;

    let textBefore = m[1].trim();
    const price = parsePrice(m[2]);
    if (price <= 0) return null;

    // If there are MULTIPLE prices on the line (e.g. "2 @ 19.50  39.00"),
    // the regex already captured the last one (39.00). The textBefore is
    // "2 @ 19.50" which we'll handle in isQuantityLine.

    return { textBefore, price };
}

/**
 * Detect if text looks like a quantity indicator:
 *   "2 @"            →  qty line, no inline name
 *   "2 @ 19.50"      →  qty line, no inline name (unit price left over)
 *   "2 x Coke"       →  qty line, inline name "Coke"
 *   "1@ R19.50"      →  qty line, no inline name
 */
function isQuantityLine(
    text: string
): { inlineName: string } | null {
    // "2 @ 19.50" or "2@ 19.50" or "2 @19.50" or just "2 @"
    const atMatch = text.match(/^\d+\s*@\s*R?\s*\d*[.,]?\d*\s*$/i);
    if (atMatch) return { inlineName: '' };

    // "2 @ 19.50" with possible trailing text
    const atMatch2 = text.match(/^\d+\s*@\s*R?\s*\d+[.,]\d{2}\s+(.+)$/i);
    if (atMatch2) return { inlineName: atMatch2[1].trim() };

    // "2 @" alone (no unit price)
    const atSimple = text.match(/^\d+\s*@\s*$/);
    if (atSimple) return { inlineName: '' };

    // "2x Coke" or "2 x Coke" or "2 X Coke"
    const xMatch = text.match(/^\d+\s*[xX×]\s+(.+)$/);
    if (xMatch) return { inlineName: xMatch[1].trim() };

    // "2x" alone
    const xAlone = text.match(/^\d+\s*[xX×]\s*$/);
    if (xAlone) return { inlineName: '' };

    return null;
}

/**
 * Clean an extracted item name.
 */
function cleanName(raw: string): string {
    return raw
        .replace(/[.…]+$/, '')          // trailing dots
        .replace(/^\d+\s*[xX×@]\s*/, '') // leading "2x " or "2 @ "
        .replace(/R?\s*\d+[.,]\d{2}$/, '') // trailing unit price left-over
        .replace(/\s+/g, ' ')           // normalise whitespace
        .replace(/^[\s\-*#]+/, '')       // leading dashes / asterisks
        .replace(/[\s\-*#]+$/, '')       // trailing dashes / asterisks
        .trim();
}

/**
 * Should this name be rejected? Only exact matches and starts-with for
 * totals, tax, and payment words. We keep this TIGHT to avoid false negatives.
 */
function isRejectName(name: string): boolean {
    const lower = name.toLowerCase();

    // Pure numbers
    if (/^\d[\d\s/\-.,]*$/.test(lower)) return true;

    // Exact rejects
    const exact = [
        'total', 'totaal', 'subtotal', 'sub total', 'nett total',
        'grand total', 'vat', 'btw', 'tax', 'change', 'wisselgeld',
        'cash', 'card', 'visa', 'mastercard', 'debit', 'credit',
        'eft', 'balance', 'balans', 'rounding', 'round', 'ronding',
        'amount due', 'amount tendered', 'tender', 'payment',
        'subtotaal', 'incl vat', 'excl vat',
    ];
    if (exact.includes(lower)) return true;

    // Starts-with rejects
    const starts = [
        'total ', 'totaal ', 'subtotal ', 'sub total',
        'vat ', 'tax ', 'change ', 'balance ',
        'amount due', 'amount tendered', 'auth code',
        'ref no', 'reference',
    ];
    if (starts.some((p) => lower.startsWith(p))) return true;

    return false;
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
