import { describe, it, expect } from 'vitest';
import { buildBedrockBody, toBareBase64 } from '../services/bedrockBodyBuilder';
import { BedrockModel } from '../types';

const IMG = 'data:image/png;base64,AAAABBBB';

describe('toBareBase64', () => {
  it('strips a data URL prefix', () => {
    expect(toBareBase64(IMG)).toBe('AAAABBBB');
  });

  it('passes through a value that is already bare base64', () => {
    expect(toBareBase64('AAAABBBB')).toBe('AAAABBBB');
  });
});

describe('buildBedrockBody', () => {
  it('throws on an unknown model', () => {
    expect(() => buildBedrockBody('bogus' as BedrockModel, IMG, {})).toThrow();
  });

  it('puts the source under `image` and defaults to png', () => {
    const body = buildBedrockBody(BedrockModel.REMOVE_BACKGROUND, IMG, {});
    expect(body.image).toBe('AAAABBBB');
    expect(body.output_format).toBe('png');
    expect(body.init_image).toBeUndefined();
  });

  it('puts the source under `init_image` for style transfer', () => {
    const body = buildBedrockBody(BedrockModel.STYLE_TRANSFER, IMG, {
      style_image: 'data:image/png;base64,STYLE',
    });
    expect(body.init_image).toBe('AAAABBBB');
    expect(body.style_image).toBe('STYLE');
    expect(body.image).toBeUndefined();
  });

  it('forces jpeg on the capped upscalers regardless of requested format', () => {
    const body = buildBedrockBody(BedrockModel.UPSCALE_CREATIVE, IMG, {
      prompt: 'a wall',
      output_format: 'png',
    });
    expect(body.output_format).toBe('jpeg');
  });

  it('honours a requested format on services without the cap', () => {
    const body = buildBedrockBody(BedrockModel.INPAINT, IMG, {
      prompt: 'a lion',
      output_format: 'webp',
    });
    expect(body.output_format).toBe('webp');
  });

  it('omits style_preset when set to the "none" sentinel', () => {
    const body = buildBedrockBody(BedrockModel.INPAINT, IMG, {
      prompt: 'x',
      style_preset: 'none',
    });
    expect('style_preset' in body).toBe(false);
  });

  it('sends style_preset when a real preset is chosen', () => {
    const body = buildBedrockBody(BedrockModel.INPAINT, IMG, {
      prompt: 'x',
      style_preset: 'cinematic',
    });
    expect(body.style_preset).toBe('cinematic');
  });

  it('omits a zero seed (zero means random)', () => {
    const body = buildBedrockBody(BedrockModel.INPAINT, IMG, { prompt: 'x', seed: 0 });
    expect('seed' in body).toBe(false);
  });

  it('sends a non-zero seed as a number', () => {
    const body = buildBedrockBody(BedrockModel.INPAINT, IMG, { prompt: 'x', seed: 42 });
    expect(body.seed).toBe(42);
  });

  it('coerces slider values to numbers', () => {
    const body = buildBedrockBody(BedrockModel.UPSCALE_CONSERVATIVE, IMG, {
      prompt: 'x',
      creativity: '0.4' as unknown as number,
    });
    expect(body.creativity).toBe(0.4);
    expect(typeof body.creativity).toBe('number');
  });

  it('skips empty and undefined optional fields', () => {
    const body = buildBedrockBody(BedrockModel.INPAINT, IMG, {
      prompt: 'x',
      negative_prompt: '',
      mask: undefined,
    });
    expect('negative_prompt' in body).toBe(false);
    expect('mask' in body).toBe(false);
  });

  it('strips the data URL prefix from a mask image', () => {
    const body = buildBedrockBody(BedrockModel.ERASE, IMG, {
      mask: 'data:image/png;base64,MASKDATA',
    });
    expect(body.mask).toBe('MASKDATA');
  });

  describe('outpaint directions', () => {
    it('sends only the non-zero directions', () => {
      const body = buildBedrockBody(BedrockModel.OUTPAINT, IMG, {
        left: 128,
        right: 0,
        up: 64,
        down: 0,
      });
      expect(body.left).toBe(128);
      expect(body.up).toBe(64);
      expect('right' in body).toBe(false);
      expect('down' in body).toBe(false);
    });

    it('falls back to a default direction when all are zero', () => {
      // Bedrock rejects an outpaint request with no direction supplied.
      const body = buildBedrockBody(BedrockModel.OUTPAINT, IMG, {
        left: 0, right: 0, up: 0, down: 0,
      });
      expect(body.left).toBe(256);
    });

    it('clamps a direction to the documented 2000px maximum', () => {
      const body = buildBedrockBody(BedrockModel.OUTPAINT, IMG, { right: 99999 });
      expect(body.right).toBe(2000);
    });

    it('rounds fractional direction values', () => {
      const body = buildBedrockBody(BedrockModel.OUTPAINT, IMG, { down: 12.6 });
      expect(body.down).toBe(13);
    });
  });

  it('carries the word-driven search fields through', () => {
    const replace = buildBedrockBody(BedrockModel.SEARCH_REPLACE, IMG, {
      search_prompt: 'the red car',
      prompt: 'a blue bicycle',
    });
    expect(replace.search_prompt).toBe('the red car');
    expect(replace.prompt).toBe('a blue bicycle');

    const recolor = buildBedrockBody(BedrockModel.SEARCH_RECOLOR, IMG, {
      select_prompt: 'the jacket',
      prompt: 'emerald green',
    });
    expect(recolor.select_prompt).toBe('the jacket');
  });

  it('never emits an unexpected top-level field for a one-tap service', () => {
    const body = buildBedrockBody(BedrockModel.UPSCALE_FAST, IMG, {});
    expect(Object.keys(body).sort()).toEqual(['image', 'output_format']);
  });
});
