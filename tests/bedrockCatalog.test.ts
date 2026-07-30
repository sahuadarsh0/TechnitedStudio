import { describe, it, expect } from 'vitest';
import {
  BEDROCK_SERVICES,
  getBedrockService,
  getBedrockServicesByCategory,
  isOneTapService,
  BEDROCK_CATEGORY_ORDER,
} from '../bedrockCatalog';
import { BedrockModel } from '../types';

describe('bedrockCatalog', () => {
  it('registers all 13 Stability AI image services', () => {
    expect(BEDROCK_SERVICES).toHaveLength(13);
  });

  it('has a unique catalog entry for every BedrockModel enum member', () => {
    const enumIds = Object.values(BedrockModel);
    const catalogIds = BEDROCK_SERVICES.map((s) => s.id);
    expect(new Set(catalogIds).size).toBe(catalogIds.length);
    for (const id of enumIds) {
      expect(catalogIds).toContain(id);
    }
  });

  it('uses the us. cross-region inference prefix on every model id', () => {
    // Verified against live Bedrock: the bare `stability.*` ids appear in
    // ListFoundationModels but are NOT invocable.
    for (const svc of BEDROCK_SERVICES) {
      expect(svc.id.startsWith('us.stability.')).toBe(true);
    }
  });

  it('splits into 3 upscalers, 6 editors and 4 control models', () => {
    expect(getBedrockServicesByCategory('upscale')).toHaveLength(3);
    expect(getBedrockServicesByCategory('edit')).toHaveLength(6);
    expect(getBedrockServicesByCategory('control')).toHaveLength(4);
  });

  it('covers every category in the display order', () => {
    const cats = new Set(BEDROCK_SERVICES.map((s) => s.category));
    for (const c of cats) expect(BEDROCK_CATEGORY_ORDER).toContain(c);
  });

  it('forces jpeg on the upscalers whose PNG output exceeds the payload cap', () => {
    // Live test: creative-upscale returned a 17 MB PNG and was rejected.
    expect(getBedrockService(BedrockModel.UPSCALE_CREATIVE)?.forceJpeg).toBe(true);
    expect(getBedrockService(BedrockModel.UPSCALE_CONSERVATIVE)?.forceJpeg).toBe(true);
  });

  it('treats parameterless services as one-tap', () => {
    expect(isOneTapService(BedrockModel.REMOVE_BACKGROUND)).toBe(true);
    expect(isOneTapService(BedrockModel.UPSCALE_FAST)).toBe(true);
    // These need a prompt or a second image.
    expect(isOneTapService(BedrockModel.SEARCH_REPLACE)).toBe(false);
    expect(isOneTapService(BedrockModel.STYLE_TRANSFER)).toBe(false);
  });

  it('sends style transfer under init_image, everything else under image', () => {
    expect(getBedrockService(BedrockModel.STYLE_TRANSFER)?.imageField).toBe('init_image');
    for (const svc of BEDROCK_SERVICES) {
      if (svc.id !== BedrockModel.STYLE_TRANSFER) {
        expect(svc.imageField).toBe('image');
      }
    }
  });

  it('declares the documented pixel budget for the tightly capped services', () => {
    expect(getBedrockService(BedrockModel.UPSCALE_FAST)?.maxInputPixels).toBe(1048576);
    expect(getBedrockService(BedrockModel.UPSCALE_CREATIVE)?.maxInputPixels).toBe(1048576);
    expect(getBedrockService(BedrockModel.INPAINT)?.maxInputPixels).toBe(9437184);
  });

  it('keeps every slider within its documented range', () => {
    for (const svc of BEDROCK_SERVICES) {
      for (const p of svc.params) {
        if (p.type !== 'slider') continue;
        expect(p.min).toBeDefined();
        expect(p.max).toBeDefined();
        expect(p.min! < p.max!).toBe(true);
        if (p.default !== undefined) {
          expect(Number(p.default)).toBeGreaterThanOrEqual(p.min!);
          expect(Number(p.default)).toBeLessThanOrEqual(p.max!);
        }
      }
    }
  });

  it('gives every select param a default drawn from its own options', () => {
    for (const svc of BEDROCK_SERVICES) {
      for (const p of svc.params) {
        if (p.type !== 'select') continue;
        expect(p.options && p.options.length > 0).toBe(true);
        if (p.default !== undefined) {
          expect(p.options).toContain(String(p.default));
        }
      }
    }
  });

  it('requires a search term on the word-driven edit services', () => {
    const replace = getBedrockService(BedrockModel.SEARCH_REPLACE)!;
    const recolor = getBedrockService(BedrockModel.SEARCH_RECOLOR)!;
    expect(replace.params.find((p) => p.key === 'search_prompt')?.required).toBe(true);
    expect(recolor.params.find((p) => p.key === 'select_prompt')?.required).toBe(true);
  });

  it('returns undefined for an unknown model id', () => {
    expect(getBedrockService('nope' as BedrockModel)).toBeUndefined();
    expect(isOneTapService('nope' as BedrockModel)).toBe(false);
  });
});
