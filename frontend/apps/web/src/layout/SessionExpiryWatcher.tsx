import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@systrol/ui";
import { apiClient } from "../api";

export function SessionExpiryWatcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const toastCtx = useToast();
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    const unsubscribe = apiClient.onUnauthorized(() => {
      if (hasExpiredRef.current || location.pathname === "/login") {
        return;
      }
      hasExpiredRef.current = true;
      toastCtx.toast.warning("Your session has expired. Please sign in again.");
      navigate("/login", {
        replace: true,
        state: { from: location },
      });
      setTimeout(() => {
        hasExpiredRef.current = false;
      }, 3000);
    });

    return unsubscribe;
  }, [navigate, location, toastCtx]);

  return null;
}
