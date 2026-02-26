// -----------------------------------------------------------
// fhirErrorHandler — Maps FHIR/HTTP errors to friendly messages
// -----------------------------------------------------------

export interface FhirError {
  code: string;
  title: string;
  message: string;
  retryable: boolean;
  action: string;
}

const HTTP_ERROR_MAP: Record<number, FhirError> = {
  401: {
    code: "session_expired",
    title: "Session Expired",
    message: "Your session has expired. Please sign in again to continue viewing your health records.",
    retryable: false,
    action: "Sign In Again",
  },
  403: {
    code: "access_denied",
    title: "Access Denied",
    message: "You don't have permission to view this information.",
    retryable: false,
    action: "Go Home",
  },
  404: {
    code: "not_found",
    title: "Data Not Found",
    message: "The requested health record was not found.",
    retryable: false,
    action: "Go Back",
  },
  408: {
    code: "timeout",
    title: "Request Timed Out",
    message: "The server took too long to respond. Please try again.",
    retryable: true,
    action: "Try Again",
  },
  429: {
    code: "rate_limited",
    title: "Too Many Requests",
    message: "You're making requests too quickly. Please wait a moment and try again.",
    retryable: true,
    action: "Try Again",
  },
  500: {
    code: "server_error",
    title: "Server Error",
    message: "The health records server encountered an error. Please try again shortly.",
    retryable: true,
    action: "Try Again",
  },
  502: {
    code: "server_error",
    title: "Server Unavailable",
    message: "The health records server is temporarily unavailable.",
    retryable: true,
    action: "Try Again",
  },
  503: {
    code: "server_error",
    title: "Service Unavailable",
    message: "The health records service is under maintenance. Please try again later.",
    retryable: true,
    action: "Try Again",
  },
};

const UNKNOWN_ERROR: FhirError = {
  code: "unknown",
  title: "Something Went Wrong",
  message: "An unexpected error occurred while loading your health data. Please try again.",
  retryable: true,
  action: "Try Again",
};

const NETWORK_ERROR: FhirError = {
  code: "network",
  title: "Connection Problem",
  message: "Unable to connect to the health records server. Please check your internet connection.",
  retryable: true,
  action: "Try Again",
};

export function handleFhirError(error: unknown): FhirError {
  if (error && typeof error === "object") {
    const statusCode =
      (error as { status?: number }).status ??
      (error as { statusCode?: number }).statusCode ??
      (error as { response?: { status?: number } }).response?.status;

    if (statusCode && HTTP_ERROR_MAP[statusCode]) {
      return HTTP_ERROR_MAP[statusCode];
    }
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return NETWORK_ERROR;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("connection") ||
      msg.includes("cors") ||
      msg.includes("err_internet_disconnected")
    ) {
      return NETWORK_ERROR;
    }

    const statusMatch = msg.match(/\b(4\d{2}|5\d{2})\b/);
    if (statusMatch) {
      const code = parseInt(statusMatch[1], 10);
      if (HTTP_ERROR_MAP[code]) {
        return HTTP_ERROR_MAP[code];
      }
    }
  }

  return UNKNOWN_ERROR;
}

export function isSessionExpired(error: unknown): boolean {
  return handleFhirError(error).code === "session_expired";
}
