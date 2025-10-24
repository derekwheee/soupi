export {};

declare global {
    interface BroadcastMessage {
        type: SSEMessageType;
        from: string;
        data: any;
    }
}
