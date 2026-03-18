let counter = 0;

export function generateId(): string {
    counter++;
    return `${Date.now()}-${counter}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatCurrency(amount: number): string {
    return `R${amount.toFixed(2)}`;
}

export function parsePrice(text: string): number {
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}
