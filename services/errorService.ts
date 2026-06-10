import { GenerationError } from '../types';

/**
 * Maps a raw thrown error from the generation pipeline into a user-facing
 * message + stable code. Pure and unit-testable.
 */
export const parseError = (err: any): GenerationError => {
  let message = 'An unexpected error occurred.';
  let code = 'UNKNOWN';
  const errString = (err && (err.message || err.toString())) || '';

  if (errString.includes('Requested entity was not found') || errString.includes('404')) {
    message = 'API Key not found or expired. Please reconnect.';
    code = 'API_KEY_EXPIRED';
  } else if (errString.includes('403') || errString.includes('permission')) {
    message = 'Access denied. Check your API Key permissions or billing.';
    code = 'PERMISSION_DENIED';
  } else if (errString.includes('429') || errString.includes('quota') || errString.includes('exhausted')) {
    message = 'Service quota exceeded. Please try again later.';
    code = 'QUOTA_EXCEEDED';
  } else if (errString.includes('500') || errString.includes('internal')) {
    message = 'Google AI service internal error. Please try again.';
    code = 'SERVER_ERROR';
  } else if (errString.includes('SAFETY_BLOCK') || errString.includes('safety')) {
    message = 'Generation blocked by safety filters. Please adjust your prompt.';
    code = 'SAFETY_BLOCK';
  } else if (errString.includes('ABORTED') || errString.includes('user aborted')) {
    message = 'Generation stopped.';
    code = 'ABORTED';
  }

  return { message, code };
};
