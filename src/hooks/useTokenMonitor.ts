// -----------------------------------------------------------
// useTokenMonitor — Watches token expiry & warns the user
// -----------------------------------------------------------

import { useEffect, useRef } from "react";
import { useFhirClient } from "./useFhirClient";
import { useToast } from "../context/ToastContext";
import {
  getTokenInfo,
  formatTimeRemaining,
  handleSessionExpired,
} from "../utils/tokenManager";

const CHECK_INTERVAL_MS = 30_000;

export function useTokenMonitor(): void {
  const { client } = useFhirClient();
  const { addToast } = useToast();
  const warningShown = useRef(false);

  useEffect(() => {
    if (!client) return;

    warningShown.current = false;

    const checkToken = () => {
      const info = getTokenInfo(client);

      if (info.status === "expired") {
        handleSessionExpired();
        return;
      }

      if (info.status === "expiring-soon" && !warningShown.current) {
        warningShown.current = true;
        const timeStr = info.secondsRemaining
          ? formatTimeRemaining(info.secondsRemaining)
          : "soon";

        addToast({
          type: "warning",
          title: "Session Expiring",
          message: `Your session will expire in ${timeStr}. Save any work and sign in again to continue.`,
          action: "Sign In Again",
          onAction: handleSessionExpired,
          duration: 0,
        });
      }
    };

    checkToken();
    const intervalId = setInterval(checkToken, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [client, addToast]);
}
