/**
 * Safe UUID generator. `crypto.randomUUID` is only available in secure contexts
 * (https or localhost); when the dev server is opened over a LAN IP it is
 * undefined, so we fall back to a non-cryptographic id to keep features working.
 */
export const uuid = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
};
