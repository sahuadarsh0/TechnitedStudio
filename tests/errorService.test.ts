import { describe, it, expect } from 'vitest';
import { parseError } from '../services/errorService';

describe('parseError', () => {
  it('maps 404 / entity-not-found to API_KEY_EXPIRED', () => {
    expect(parseError({ message: 'Requested entity was not found' }).code).toBe('API_KEY_EXPIRED');
    expect(parseError({ message: 'HTTP 404' }).code).toBe('API_KEY_EXPIRED');
  });

  it('maps 403 / permission to PERMISSION_DENIED', () => {
    expect(parseError({ message: '403 forbidden' }).code).toBe('PERMISSION_DENIED');
    expect(parseError({ message: 'permission denied' }).code).toBe('PERMISSION_DENIED');
  });

  it('maps 429 / quota to QUOTA_EXCEEDED', () => {
    expect(parseError({ message: '429 too many' }).code).toBe('QUOTA_EXCEEDED');
    expect(parseError({ message: 'quota exhausted' }).code).toBe('QUOTA_EXCEEDED');
  });

  it('maps 500 / internal to SERVER_ERROR', () => {
    expect(parseError({ message: '500 internal error' }).code).toBe('SERVER_ERROR');
  });

  it('maps safety to SAFETY_BLOCK', () => {
    expect(parseError({ message: 'SAFETY_BLOCK' }).code).toBe('SAFETY_BLOCK');
  });

  it('maps abort to ABORTED', () => {
    expect(parseError({ message: 'ABORTED' }).code).toBe('ABORTED');
    expect(parseError({ message: 'the user aborted a request' }).code).toBe('ABORTED');
  });

  it('falls back to UNKNOWN for unrecognized errors', () => {
    const result = parseError({ message: 'something weird' });
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBeTruthy();
  });

  it('handles non-Error inputs gracefully', () => {
    expect(parseError('boom').code).toBe('UNKNOWN');
    expect(parseError(null).code).toBe('UNKNOWN');
  });
});
