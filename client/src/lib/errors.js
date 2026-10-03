/** Turn any axios/network error into a short, user-facing message. */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;
  if (error.code === 'ERR_CANCELED') return 'Request was cancelled.';
  if (!error.response) {
    return "Can't reach the CareerPilot server. Check your connection and try again.";
  }
  const { status, data } = error.response;
  const serverMessage = typeof data === 'object' && data?.message ? data.message : null;

  switch (status) {
    case 400:
    case 409:
    case 422:
      return serverMessage || fallback;
    case 401:
      return serverMessage || 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return serverMessage || 'We couldn’t find what you were looking for.';
    case 413:
      return 'That file is too large. The maximum size is 10 MB.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    default:
      if (status >= 500) return 'The server ran into a problem. Please try again shortly.';
      return serverMessage || fallback;
  }
};

export const isNotFound = (error) => error?.response?.status === 404;
export const isConflict = (error) => error?.response?.status === 409;
