import { NextResponse } from "next/server";
import {
  getRealtimeStateVersion,
  subscribeRealtimeEvents,
} from "@/lib/realtime-bus";
import { expireOverdueReservations } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("mode") === "poll") {
    await expireOverdueReservations();
    return NextResponse.json({
      version: getRealtimeStateVersion(),
      timestamp: new Date().toISOString(),
    });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      sendEvent({
        type: "CONNECTED",
        version: getRealtimeStateVersion(),
        timestamp: new Date().toISOString(),
      });

      unsubscribe = subscribeRealtimeEvents((event) => {
        sendEvent({
          ...event,
          version: getRealtimeStateVersion(),
        });
      });

      keepAliveTimer = setInterval(async () => {
        try {
          await expireOverdueReservations();
          sendEvent({
            type: "HEARTBEAT",
            version: getRealtimeStateVersion(),
            timestamp: new Date().toISOString(),
          });
        } catch {
          // Ignore
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

