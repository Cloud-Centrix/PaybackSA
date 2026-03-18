import { Share, Platform, Linking } from 'react-native';
import { PersonShare, UserSettings } from '../types';
import { formatCurrency } from './helpers';

export function generateShareMessage(
    billName: string,
    share: PersonShare,
    paidByName: string,
    settings: UserSettings
): string {
    const itemLines = share.items
        .map((i) => `  • ${i.name}: ${formatCurrency(i.amount)}`)
        .join('\n');

    let message = `Hey ${share.person.name}! Here's your share of the bill:\n\n`;
    message += `📋 ${billName}\n`;
    if (paidByName && paidByName !== 'Unknown') {
        message += `💳 Paid by: ${paidByName}\n`;
    }
    message += `\nItems:\n${itemLines}\n\n`;
    message += `💰 You owe: ${formatCurrency(share.total)}\n`;

    if (settings.accountName || settings.bankName) {
        message += `\n🏦 Pay to:\n`;
        if (settings.accountName)
            message += `  Account Name: ${settings.accountName}\n`;
        if (settings.bankName) message += `  Bank: ${settings.bankName}\n`;
        if (settings.accountNumber)
            message += `  Account No: ${settings.accountNumber}\n`;
        if (settings.branchCode)
            message += `  Branch Code: ${settings.branchCode}\n`;
    }

    message += `\nSent via PayBack SA 🇿🇦`;
    return message;
}

export function generateGroupShareMessage(
    billName: string,
    shares: PersonShare[],
    paidByName: string,
    grandTotal: number,
    settings: UserSettings,
    paidBack?: Record<string, boolean>
): string {
    let message = `📋 *${billName}* - Bill Summary\n\n`;
    message += `� ${shares.length} people\n`;
    if (paidByName && paidByName !== 'Unknown') {
        message += `💳 Paid by: ${paidByName}\n`;
    }
    message += `💰 Total: ${formatCurrency(grandTotal)}\n\n`;

    shares.forEach((share) => {
        const isPaid = paidBack?.[share.person.id] ?? false;
        const status = isPaid ? '✅' : '❌';
        message += `${status} *${share.person.name}* — ${formatCurrency(share.total)}${isPaid ? ' (PAID)' : ''}\n`;
        share.items.forEach((item) => {
            message += `      • ${item.name}: ${formatCurrency(item.amount)}\n`;
        });
        message += '\n';
    });

    if (settings.accountName || settings.bankName) {
        message += `\n🏦 *Bank Details for payment:*\n`;
        if (settings.accountName)
            message += `  Account Name: ${settings.accountName}\n`;
        if (settings.bankName) message += `  Bank: ${settings.bankName}\n`;
        if (settings.accountNumber)
            message += `  Account No: ${settings.accountNumber}\n`;
        if (settings.branchCode)
            message += `  Branch Code: ${settings.branchCode}\n`;
    }

    message += `\nSent via PayBack SA 🇿🇦`;
    return message;
}

export async function shareViaWhatsApp(message: string): Promise<void> {
    const encoded = encodeURIComponent(message);
    const url = `whatsapp://send?text=${encoded}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
        await Linking.openURL(url);
    } else {
        // Fallback to general share
        await Share.share({ message });
    }
}

export async function shareViaEmail(
    message: string,
    subject: string
): Promise<void> {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(message);
    const url = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
        await Linking.openURL(url);
    } else {
        await Share.share({ message, title: subject });
    }
}

export async function shareNative(message: string): Promise<void> {
    await Share.share({ message });
}
