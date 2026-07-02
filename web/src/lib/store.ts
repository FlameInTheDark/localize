import { create } from "zustand";

/**
 * Shared app store for cross-panel communication.
 *
 * Currently used by the OCR panel's "Send to translation" action: it sets
 * `pendingInput` + `requestTextTab`, and the Text tab consumes it on mount.
 */

interface AppState {
  /** Text to paste into the Text translator when it next becomes active. */
  pendingInput: string;
  /** Bumped whenever a new pendingInput is set, so consumers can detect changes. */
  requestTextTab: number;
  /** Set text to be loaded into the Text translator, and signal the tab switch. */
  sendToTranslation: (text: string) => void;
  /** Consume (read + clear) the pending input. Returns the text or null. */
  consumePendingInput: () => string | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  pendingInput: "",
  requestTextTab: 0,
  sendToTranslation: (text) =>
    set((s) => ({
      pendingInput: text,
      requestTextTab: s.requestTextTab + 1,
    })),
  consumePendingInput: () => {
    const { pendingInput } = get();
    if (!pendingInput) return null;
    set({ pendingInput: "" });
    return pendingInput;
  },
}));
