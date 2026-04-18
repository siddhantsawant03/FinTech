export function getErrorMessage(error, fallback = "Something went wrong") {
  const candidate =
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.message ??
    error;

  if (!candidate) return fallback;
  if (typeof candidate === "string") return candidate;
  if (typeof candidate === "number" || typeof candidate === "boolean") {
    return String(candidate);
  }

  if (typeof candidate === "object") {
    if (typeof candidate.message === "string") {
      return candidate.code
        ? `${candidate.code}: ${candidate.message}`
        : candidate.message;
    }
    if (typeof candidate.error === "string") return candidate.error;
    try {
      return JSON.stringify(candidate);
    } catch (_) {
      return fallback;
    }
  }

  return fallback;
}
