import type { AlertButton } from "react-native";

// React Native's Alert is a no-op on web. Keep account controls usable in PWA.
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const text = [title, message].filter(Boolean).join("\n\n");
    const action = buttons?.find(button => button.style !== "cancel");
    if (action) {
      if (window.confirm(text)) action.onPress?.();
      else buttons?.find(button => button.style === "cancel")?.onPress?.();
    } else window.alert(text);
  },
};
