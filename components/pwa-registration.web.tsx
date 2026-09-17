import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    if (__DEV__) {
      // Old development workers can cache Metro's unversioned JS URL. Release
      // only this app's worker; student responses remain in local storage.
      const isAppWorker = (worker: ServiceWorker | null) => {
        if (!worker) return false;
        const url = new URL(worker.scriptURL);
        return url.origin === window.location.origin && url.pathname === "/sw.js";
      };
      void navigator.serviceWorker.getRegistrations().then(async registrations => {
        const controlled = isAppWorker(navigator.serviceWorker.controller);
        const owned = registrations.filter(registration =>
          [registration.active, registration.waiting, registration.installing].some(isAppWorker));
        const removed = await Promise.all(owned.map(registration => registration.unregister()));
        if (controlled && removed.some(Boolean)) window.location.reload();
      }).catch(error => console.warn("Hindi ma-refresh ang development Wikalino.", error));
      return;
    }
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(error => console.warn("Hindi maihanda ang offline Wikalino.", error));
  }, []);
  return null;
}
