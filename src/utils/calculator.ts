import { Bill, PersonShare } from '../types';

/** Round to 2 decimal places (cents) */
function cents(n: number): number {
    return Math.round(n * 100) / 100;
}

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

        const count = item.assignedTo.length;
        const perPerson = cents(item.price / count);
        // Give the remainder cent(s) to the last person so the split is exact
        const remainder = cents(item.price - perPerson * count);

        item.assignedTo.forEach((personId, idx) => {
            const share = shares.find((s) => s.person.id === personId);
            if (share) {
                const amount = idx === count - 1 ? perPerson + remainder : perPerson;
                share.items.push({
                    name: item.name,
                    amount,
                });
                share.total += amount;
            }
        });
    });

    // Distribute tip proportionally
    if (tipTotal > 0 && billSubtotal > 0) {
        let tipDistributed = 0;
        const lastIdx = shares.length - 1;

        shares.forEach((share, idx) => {
            if (idx === lastIdx) {
                // Last person gets the remainder to avoid rounding drift
                share.total = cents(share.total + (tipTotal - tipDistributed));
            } else {
                const tipShare = cents((share.total / billSubtotal) * tipTotal);
                tipDistributed += tipShare;
                share.total = cents(share.total + tipShare);
            }
        });
    } else {
        // Round totals
        shares.forEach((share) => {
            share.total = cents(share.total);
        });
    }

    return shares;
}
