import { Bill, PersonShare } from '../types';

export function calculateShares(bill: Bill): PersonShare[] {
    const shares: PersonShare[] = bill.people.map((person) => ({
        person,
        items: [],
        total: 0,
    }));

    const tipTotal = bill.tip ?? 0;
    let billSubtotal = 0;

    bill.items.forEach((item) => {
        billSubtotal += item.price;
        if (item.assignedTo.length === 0) return;

        const perPersonAmount = item.price / item.assignedTo.length;

        item.assignedTo.forEach((personId) => {
            const share = shares.find((s) => s.person.id === personId);
            if (share) {
                share.items.push({
                    name: item.name,
                    amount: Math.round(perPersonAmount * 100) / 100,
                });
                share.total += perPersonAmount;
            }
        });
    });

    // Distribute tip proportionally
    if (tipTotal > 0 && billSubtotal > 0) {
        shares.forEach((share) => {
            const tipShare = (share.total / billSubtotal) * tipTotal;
            share.total += tipShare;
        });
    }

    // Round totals
    shares.forEach((share) => {
        share.total = Math.round(share.total * 100) / 100;
    });

    return shares;
}
