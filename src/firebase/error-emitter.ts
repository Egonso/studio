// Defines a simple event emitter for handling errors globally.
// This allows different parts of the application to report errors
// to a central listener without being tightly coupled.

type EventMap = {
    'permission-error': (error: Error) => void;
};

class ErrorEmitter {
    private listeners: { [K in keyof EventMap]?: Array<EventMap[K]> } = {};

    on<K extends keyof EventMap>(event: K, listener: EventMap[K]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    off<K extends keyof EventMap>(event: K, listener: EventMap[K]): void {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
    }

    emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): void {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event]!.forEach(listener => {
            try {
                (listener as any)(...args);
            } catch (e) {
                console.error(`Error in listener for event "${event}":`, e);
            }
        });
    }
}

export const errorEmitter = new ErrorEmitter();
