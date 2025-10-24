// sse.ts
import { Response } from 'express';
import { SSEMessageType } from './constants';

export const clientsByHousehold = new Map<number, Response[]>();

export function addClient(householdId: number, res: Response) {
    if (!clientsByHousehold.has(householdId))
        clientsByHousehold.set(householdId, []);
    clientsByHousehold.get(householdId)!.push(res);

    res.on('close', () => {
        const arr = clientsByHousehold.get(householdId)!;
        const index = arr.indexOf(res);
        if (index !== -1) arr.splice(index, 1);
    });
}

export async function broadcast<T>(
    householdId: number,
    type: SSEMessageType,
    from: string,
    cb: () => Promise<T>,
) {
    const data = await cb();
    const message: BroadcastMessage = {
        type,
        from,
        data,
    };
    const clients = clientsByHousehold.get(householdId) ?? [];
    clients.forEach((res) => res.write(`data: ${JSON.stringify(message)}\n\n`));
    
    return data;
}
