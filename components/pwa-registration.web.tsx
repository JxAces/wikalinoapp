import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!__DEV__ && "serviceWorker" in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(error => console.warn("Hindi maihanda ang offline Wikalino.", error));
    }
  }, []);
  return null;
}
