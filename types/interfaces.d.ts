export {};

declare global {
    interface BroadcastMessage {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
        from: string;
        type: SSEMessageType;
    }
}
