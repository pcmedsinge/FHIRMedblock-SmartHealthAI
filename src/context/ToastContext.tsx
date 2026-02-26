// -----------------------------------------------------------
// ToastContext — App-wide toast notification system
// -----------------------------------------------------------

import { createContext, useReducer, useContext, useCallback } from "react";
import type { ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
  duration: number;
}

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.toast].slice(-5);
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    case "CLEAR":
      return [];
  }
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (opts: AddToastOptions) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

interface AddToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
  duration?: number;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  warning: 8000,
  error: 0,
};

let toastCounter = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const addToast = useCallback(
    (opts: AddToastOptions) => {
      const type = opts.type ?? "info";
      const id = `toast_${++toastCounter}_${Date.now()}`;
      const duration = opts.duration ?? DEFAULT_DURATION[type];

      const toast: Toast = {
        id,
        type,
        title: opts.title,
        message: opts.message,
        action: opts.action,
        onAction: opts.onAction,
        duration,
      };

      dispatch({ type: "ADD", toast });

      if (duration > 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE", id });
        }, duration);
      }
    },
    []
  );

  const clearToasts = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
