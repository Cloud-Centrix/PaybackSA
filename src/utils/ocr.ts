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
 * Scan a receipt image and return parsed bill items + raw OCR text.
 */
export async function scanReceipt(imageUri: string): Promise<{ items: BillItem[]; rawText: string }> {
    const rawText = await callVisionAPI(imageUri);
    const items = parseReceiptText(rawText);
    return { items, rawText };
}

/**
 * Parse raw OCR text into bill items.
 *
 * Block-based approach that handles multiple SA receipt formats:
 *
 * **Block format** (Checkers, Spar, Pick n Pay, Woolworths):
 *   Nuveg Frozen Butternut with Cinnamon   ← name (1+ lines)
 *   R 59.99                                 ← unit price
 *   R 59.99                                 ← line total
 *   Qty 1                                   ← quantity
 *
 * **Inline format** (restaurants, cafés):
 *   Burger              R89.90
 *
 * **Qty-line format** (Spar-style):
 *   SASKO WHITE BREAD 700G
 *   2 @ 16.99          33.98
 *
 * Strategy:
 * 1. Classify each line (standalone price / qty / skip / qty×price / inline / name).
 * 2. Accumulate name lines until prices appear.
 * 3. When a new name appears after prices, finalize the previous item.
 * 4. Use the LAST price in each block as the line total.
 */
export function parseReceiptText(rawText: string): BillItem[] {
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const items: BillItem[] = [];
    let currentName = '';
    let prices: number[] = [];

    function finalizeItem() {
        if (currentName && prices.length > 0) {
            const total = prices[prices.length - 1]; // last price = line total
            const cleaned = cleanItemName(currentName);
            if (cleaned.length >= 2 && total > 0 && !isRejectName(cleaned)) {
                items.push({
                    id: generateId(),
                    name: cleaned,
                    price: Math.round(total * 100) / 100,
                    assignedTo: [],
                });
            }
        }
        currentName = '';
        prices = [];
    }

    for (const line of lines) {
        // 1. Standalone price: "R 59.99", "R. 59.99", "R59,99"
        if (/^R\s*\.?\s*\d+[.,]\d{2}\s*$/.test(line)) {
            const p = extractPrice(line);
            if (p > 0) prices.push(p);
            continue;
        }

        // 2. Qty indicator alone: "Qty 1", "Qty 2"
        if (/^Qty\s*\d+$/i.test(line)) {
            continue;
        }

        // 3. Skip lines (headers, promos, weights, separators)
        if (isSkipLine(line)) continue;

        // 4. Qty × price line: "2 @ 16.99  33.98" or "2 @ 16.99"
        const qtyPriceMatch = line.match(
            /^(\d+)\s*[@×xX]\s*R?\s*(\d+[.,]\d{2})(?:\s+.*?(\d+[.,]\d{2}))?\s*$/
        );
        if (qtyPriceMatch) {
            const qty = parseInt(qtyPriceMatch[1], 10);
            const unit = parsePrice(qtyPriceMatch[2]);
            const total = qtyPriceMatch[3]
                ? parsePrice(qtyPriceMatch[3])
                : Math.round(unit * qty * 100) / 100;
            if (total > 0) prices.push(total);
            continue;
        }

        // 5. Inline name + price: "Burger  R89.90" or "Burger  89.90"
        const inlineMatch = line.match(
            /^(.{2,})(?:\s+R\s*|\s{2,})(\d+[.,]\d{2})\s*$/
        );
        if (inlineMatch) {
            const inlineName = inlineMatch[1].trim();
            const inlinePrice = parsePrice(inlineMatch[2]);
            if (inlineName.length >= 2 && inlinePrice > 0 && !isRejectName(inlineName)) {
                finalizeItem();
                items.push({
                    id: generateId(),
                    name: cleanItemName(inlineName),
                    price: inlinePrice,
                    assignedTo: [],
                });
            }
            continue;
        }

        // 6. Name line — if we already have prices, this starts a new item
        if (prices.length > 0) {
            finalizeItem();
        }
        currentName = currentName ? currentName + ' ' + line : line;
    }

    // Finalize last item
    finalizeItem();

    return items;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Extract the first decimal price from a line. */
function extractPrice(line: string): number {
    const m = line.match(/(\d+[.,]\d{2})/);
    return m ? parsePrice(m[1]) : 0;
}

/** Lines to skip entirely. */
function isSkipLine(line: string): boolean {
    const l = line.toLowerCase().trim();

    // Separators: "-----", "=====", "*****"
    if (/^[-=*_]{3,}$/.test(l)) return true;

    // Pure weight/size: "320g", "200g", "500ml"
    if (/^\d+\s*(g|kg|ml|l|cl)\s*$/i.test(l)) return true;

    // Promo/discount lines
    if (l.startsWith('**') || /^-\s*R\s*\d/i.test(l)) return true;

    // Known headers & metadata
    const skip = [
        'product detail', 'price (per item)', 'total', 'subtotal',
        'sub total', 'nett total', 'grand total', 'vat', 'btw', 'tax',
        'cash', 'card', 'visa', 'mastercard', 'debit', 'credit',
        'eft', 'balance', 'balans', 'rounding', 'round', 'ronding',
        'amount due', 'amount tendered', 'tender', 'payment',
        'incl vat', 'excl vat', 'tax invoice', 'receipt',
        'change', 'wisselgeld', 'pack',
    ];
    if (skip.includes(l)) return true;

    // Starts with known total/tax/metadata words
    const starts = [
        'total ', 'totaal ', 'subtotal ', 'sub total ',
        'vat ', 'tax ', 'balance ', 'change ',
        'amount due', 'amount tendered', 'auth code',
        'ref no', 'reference', 'date ', 'time ', 'store ',
        'tel ', 'cashier', 'till ', 'receipt no', 'invoice no',
    ];
    if (starts.some((s) => l.startsWith(s))) return true;

    return false;
}

/** Clean up an item name. */
function cleanItemName(raw: string): string {
    return raw
        .replace(/^\d+\.\s*/, '')           // leading "1. "
        .replace(/^\d+\s*[xX×@]\s*/, '')   // leading "2x " or "2 @ "
        .replace(/R?\s*\d+[.,]\d{2}$/, '')  // trailing price leftover
        .replace(/[.…]+$/, '')              // trailing dots
        .replace(/\s+/g, ' ')              // normalize whitespace
        .replace(/^[\s\-*#]+/, '')          // leading decorations
        .replace(/[\s\-*#]+$/, '')          // trailing decorations
        .trim();
}

/** Should this name be rejected? */
function isRejectName(name: string): boolean {
    const l = name.toLowerCase().trim();

    // Pure numbers / dates
    if (/^\d[\d\s/\-.,]*$/.test(l)) return true;

    // Exact reject words
    const exact = [
        'total', 'totaal', 'subtotal', 'sub total', 'nett total',
        'grand total', 'vat', 'btw', 'tax', 'change', 'wisselgeld',
        'cash', 'card', 'visa', 'mastercard', 'debit', 'credit',
        'eft', 'balance', 'balans', 'rounding', 'round', 'ronding',
        'amount due', 'amount tendered', 'tender', 'payment',
        'subtotaal', 'incl vat', 'excl vat',
    ];
    if (exact.includes(l)) return true;

    // Starts-with rejects
    const starts = [
        'total ', 'totaal ', 'subtotal ', 'sub total ',
        'vat ', 'tax ', 'change ', 'balance ',
        'amount due', 'amount tendered', 'auth code',
    ];
    if (starts.some((s) => l.startsWith(s))) return true;

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
