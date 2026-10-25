import { ApiError } from "./client";

function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError ||
    (typeof error === "object" &&
      error !== null &&
      (error as ApiError).name === "ApiError" &&
      typeof (error as ApiError).message === "string")
  );
}

export function formatErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    const parts = [error.message];
    if (error.details) {
      const fieldMessages = Object.entries(error.details)
        .flatMap(([field, msgs]) => msgs.map((m) => `${field}: ${m}`))
        .slice(0, 3);
      if (fieldMessages.length > 0) {
        parts.push(fieldMessages.join("\n"));
      }
    }
    if (error.statusCode === 409) {
      parts.push("Use Recover on the welcome screen with the same 12 words.");
    }
    return parts.join("\n\n");
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
