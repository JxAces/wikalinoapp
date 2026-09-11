import { useEffect } from "react";

export function useWorldKeyboard(active: boolean, onMove: (x: number, y: number) => void) {
  useEffect(() => {
    if (!active) return;
    const held = new Set<string>();
    const keys = new Set(["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"]);
    const send = () => onMove(Number(held.has("d") || held.has("arrowright")) - Number(held.has("a") || held.has("arrowleft")), Number(held.has("w") || held.has("arrowup")) - Number(held.has("s") || held.has("arrowdown")));
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return;
      const key = event.key.toLowerCase();
      if (!keys.has(key)) return;
      event.preventDefault(); held.add(key); send();
    };
    const up = (event: KeyboardEvent) => { if (held.delete(event.key.toLowerCase())) { event.preventDefault(); send(); } };
    const reset = () => { held.clear(); onMove(0, 0); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset); document.removeEventListener("visibilitychange", reset); reset();
    };
  }, [active, onMove]);
}
