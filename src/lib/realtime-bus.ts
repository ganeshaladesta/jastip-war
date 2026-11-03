export type RealtimeEventType =
  | "PRODUCT_UPDATED"
  | "PRODUCT_CREATED"
  | "PRODUCT_DELETED"
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "SESSION_UPDATED"
  | "SETTINGS_UPDATED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  timestamp: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

type Listener = (event: RealtimeEventPayload) => void;

const globalForRealtime = globalThis as unknown as {
  __jastipRealtimeListeners?: Set<Listener>;
  __jastipRealtimeVersion?: number;
};

if (!globalForRealtime.__jastipRealtimeListeners) {
  globalForRealtime.__jastipRealtimeListeners = new Set();
}
if (typeof globalForRealtime.__jastipRealtimeVersion !== "number") {
  globalForRealtime.__jastipRealtimeVersion = 1;
}

export function publishRealtimeEvent(
  type: RealtimeEventType,
  entityId?: string,
  data?: Record<string, unknown>
) {
  globalForRealtime.__jastipRealtimeVersion =
    (globalForRealtime.__jastipRealtimeVersion ?? 1) + 1;

  const payload: RealtimeEventPayload = {
    type,
    timestamp: new Date().toISOString(),
    entityId,
    data,
  };

  for (const listener of globalForRealtime.__jastipRealtimeListeners ?? []) {
    try {
      listener(payload);
    } catch {
      // Ignore closed stream listener
    }
  }
}

export function subscribeRealtimeEvents(listener: Listener): () => void {
  globalForRealtime.__jastipRealtimeListeners?.add(listener);
  return () => {
    globalForRealtime.__jastipRealtimeListeners?.delete(listener);
  };
}

export function getRealtimeStateVersion(): number {
  return globalForRealtime.__jastipRealtimeVersion ?? 1;
}

