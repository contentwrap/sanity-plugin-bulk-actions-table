export interface Emitter {
  subscribe: (listener: () => void) => () => void;
  notify: () => void;
}

function createEmitter(): Emitter {
  type Listener = () => void;
  const listeners: Set<Listener> = new Set<Listener>();

  function subscribe(listener: Listener) {
    listeners.add(listener);
    const unsubscribe = () => {
      listeners.delete(listener);
    };
    return unsubscribe;
  }

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  return { subscribe, notify };
}

export default createEmitter;
