// -----------------------------------------------------------
// LoadingSpinner — Reusable loading indicator
// -----------------------------------------------------------

interface LoadingSpinnerProps {
  message?: string;
  variant?: "page" | "inline";
}

const LoadingSpinner = ({
  message = "Loading...",
  variant = "inline",
}: LoadingSpinnerProps) => {
  return (
    <div
      className={`flex items-center justify-center ${
        variant === "page" ? "min-h-screen bg-gray-50" : "min-h-[40vh]"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="text-center space-y-4">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
          aria-hidden="true"
        ></div>
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
