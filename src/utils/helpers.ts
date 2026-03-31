let counter = 0;

export function generateId(): string {
    counter++;
    return `${Date.now()}-${counter}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatCurrency(amount: number): string {
    return `R${amount.toFixed(2)}`;
}

export function parsePrice(text: string): number {
    let cleaned = text.replace(/[^0-9.,]/g, '');
    // Remove thousand separators: keep only the last comma/period as decimal
    // e.g. "1,234.56" → "1234.56", "1.234,56" → "1234.56"
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    const decimalPos = Math.max(lastComma, lastDot);
    if (decimalPos >= 0) {
        const intPart = cleaned.substring(0, decimalPos).replace(/[.,]/g, '');
        const decPart = cleaned.substring(decimalPos + 1);
        cleaned = intPart + '.' + decPart;
    } else {
        cleaned = cleaned.replace(/[.,]/g, '');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}
