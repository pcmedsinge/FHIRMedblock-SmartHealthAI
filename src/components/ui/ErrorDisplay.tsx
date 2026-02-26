// -----------------------------------------------------------
// ErrorDisplay — Reusable error message with retry action
// -----------------------------------------------------------

interface ErrorDisplayProps {
  title?: string;
  message: string;
  buttonText?: string;
  onAction?: () => void;
  variant?: "page" | "inline";
}

const ErrorDisplay = ({
  title = "Something Went Wrong",
  message,
  buttonText = "Try Again",
  onAction = () => window.location.assign("/"),
  variant = "inline",
}: ErrorDisplayProps) => {
  return (
    <div
      className={`flex items-center justify-center ${
        variant === "page" ? "min-h-screen bg-gray-50" : "min-h-[30vh]"
      }`}
      role="alert"
    >
      <div className="max-w-md w-full p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg
                     hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2
                     font-medium text-sm transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
