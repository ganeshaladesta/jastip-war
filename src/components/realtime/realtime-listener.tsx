"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function RealtimeSyncListener({ showIndicator = false }: { showIndicator?: boolean }) {
  const router = useRouter();
  const [connected, setConnected] = useState(true);
  const lastVersionRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const triggerDebouncedRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        router.refresh();
      }, 180);
    };

    // 1. Subscribe to Supabase Realtime postgres_changes if configured
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ? supabase
          .channel("jastip-war-live-sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "products" },
            () => triggerDebouncedRefresh()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            () => triggerDebouncedRefresh()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "garage_sale_sessions" },
            () => triggerDebouncedRefresh()
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") setConnected(true);
          })
      : null;

    // 2. Subscribe to SSE stream (/api/realtime) for instant local & hybrid server events
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/realtime");
      eventSource.onopen = () => setConnected(true);
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "CONNECTED") {
            lastVersionRef.current = payload.version;
            return;
          }
          if (
            typeof payload.version === "number" &&
            lastVersionRef.current !== null &&
            payload.version !== lastVersionRef.current
          ) {
            lastVersionRef.current = payload.version;
            triggerDebouncedRefresh();
          } else if (
            payload.type &&
            payload.type !== "HEARTBEAT" &&
            payload.type !== "CONNECTED"
          ) {
            triggerDebouncedRefresh();
          }
        } catch {
          // Ignore malformed event
        }
      };
      eventSource.onerror = () => {
        setConnected(false);
      };
    } catch {
      // Fallback if EventSource is blocked
    }

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [router]);

  if (!showIndicator) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/80"
      title={connected ? "Live Stock Realtime Aktif" : "Menghubungkan ulang..."}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
        }`}
      />
      LIVE SYNC
    </span>
  );
}

