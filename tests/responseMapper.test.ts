import { describe, it, expect } from 'vitest';
import { extractImageFromResponse } from '../services/responseMapper';
import { DEFAULT_SETTINGS } from '../constants';

const settings = DEFAULT_SETTINGS as any;

describe('extractImageFromResponse', () => {
  it('returns null when no image part is present', () => {
    const response = { candidates: [{ content: { parts: [{ text: 'no image' }] } }] };
    expect(extractImageFromResponse(response, 'p', settings)).toBeNull();
  });

  it('builds a data URL from inline image data', () => {
    const response = {
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
    };
    const result = extractImageFromResponse(response, 'a prompt', settings, 1.23);
    expect(result).not.toBeNull();
    expect(result!.url).toBe('data:image/png;base64,AAAA');
    expect(result!.prompt).toBe('a prompt');
    expect(result!.generationTime).toBe(1.23);
    expect(result!.id).toBeTruthy();
  });

  it('defaults mime type to image/png when missing', () => {
    const response = {
      candidates: [{ content: { parts: [{ inlineData: { data: 'BBBB' } }] } }],
    };
    const result = extractImageFromResponse(response, 'p', settings);
    expect(result!.url.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('extracts grounding sources when present', () => {
    const response = {
      candidates: [
        {
          content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'CCCC' } }] },
          groundingMetadata: {
            groundingChunks: [{ web: { title: 'Example', uri: 'https://example.com' } }],
          },
        },
      ],
    };
    const result = extractImageFromResponse(response, 'p', settings);
    expect(result!.sources).toHaveLength(1);
    expect(result!.sources![0].uri).toBe('https://example.com');
  });
});
