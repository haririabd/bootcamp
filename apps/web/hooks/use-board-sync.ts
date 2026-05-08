import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HubConnectionBuilder, HubConnectionState, LogLevel, HttpTransportType } from "@microsoft/signalr";

export function useBoardSync(boardId: string | null) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    let isMounted = true;

    // Build the connection to the .NET API Hub
    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/hubs/board`, {
        withCredentials: true, // Important for cookie auth!

        // Skip negotiation to avoid proxy/CORS bugs with Next.js development server
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,

        headers: {
          "X-Requested-With": "XMLHttpRequest"
        }
      })
      // Lower logging level to Error so it doesn't spam your console if the API restarts
      .configureLogging(LogLevel.Error)
      .withAutomaticReconnect()
      .build();

    connection.on("BoardUpdated", () => {
      // Someone changed the board! Invalidate query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    });

    // Start connection and save the promise
    const startPromise = connection.start()
      .then(() => {
        if (isMounted) {
          setIsConnected(true);
          // Tell the server which board we are looking at
          return connection.invoke("JoinBoard", boardId);
        }
      })
      .catch(() => {
        if (isMounted) {
          // A friendly warning instead of a massive red error trace
          console.warn("SignalR Sync: Could not connect to real-time hub. If you are running 'task dev:web', make sure the .NET API is also running!");
        }
      });

    return () => {
      isMounted = false;
      // Wait for the startup sequence to finish before stopping.
      // This prevents the "Stopped during negotiation" error in React Strict Mode.
      startPromise.finally(() => {
        if (connection.state === HubConnectionState.Connected) {
          connection.invoke("LeaveBoard", boardId).finally(() => connection.stop());
        } else {
          connection.stop();
        }
      });
    };
  }, [boardId, queryClient]);

  return { isConnected };
}
