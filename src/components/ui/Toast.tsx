// -----------------------------------------------------------
// ToastContainer — Renders active toast notifications
// -----------------------------------------------------------

import { useToast } from "../../context/ToastContext";
import type { Toast, ToastType } from "../../context/ToastContext";

const TOAST_STYLES: Record<
  ToastType,
  { icon: string; bg: string; border: string; iconLabel: string }
> = {
  success: { icon: "✓", bg: "bg-green-50", border: "border-green-400", iconLabel: "Success" },
  error: { icon: "✕", bg: "bg-red-50", border: "border-red-400", iconLabel: "Error" },
  warning: { icon: "⚠", bg: "bg-amber-50", border: "border-amber-400", iconLabel: "Warning" },
  info: { icon: "ℹ", bg: "bg-blue-50", border: "border-blue-400", iconLabel: "Information" },
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

const SingleToast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const style = TOAST_STYLES[toast.type];
  const iconColor = ICON_COLORS[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${style.bg} ${style.border} border-l-4 rounded-lg shadow-lg p-4
        max-w-sm w-full pointer-events-auto animate-[slideIn_0.3s_ease-out] transition-all duration-300`}
    >
      <div className="flex items-start gap-3">
        <span className={`${iconColor} text-lg font-bold flex-shrink-0 mt-0.5`} aria-label={style.iconLabel}>
          {style.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
          {toast.message && <p className="mt-1 text-sm text-gray-600">{toast.message}</p>}
          {toast.action && toast.onAction && (
            <button
              onClick={() => { toast.onAction?.(); onClose(); }}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            >
              {toast.action}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-400 min-w-[28px] min-h-[28px] flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-3 items-end pointer-events-none"
    >
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastContainer;
