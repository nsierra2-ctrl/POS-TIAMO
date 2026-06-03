type Subscriber = (data: string) => void;

const subscribers = new Set<Subscriber>();

export function addSubscriber(fn: Subscriber) {
  subscribers.add(fn);
}

export function removeSubscriber(fn: Subscriber) {
  subscribers.delete(fn);
}

export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const fn of subscribers) {
    try {
      fn(payload);
    } catch {
      subscribers.delete(fn);
    }
  }
}
