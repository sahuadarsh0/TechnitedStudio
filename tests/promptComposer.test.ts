import { describe, it, expect } from 'vitest';
import { constructCinematicPrompt } from '../services/promptComposer';
import { DEFAULT_SETTINGS } from '../constants';
import {
  GenerationSettings,
  CameraType,
  LightingStyle,
  CameraAngle,
  FocusTarget,
  Aperture,
} from '../types';

const baseSettings = (): GenerationSettings => ({
  ...DEFAULT_SETTINGS,
  cinematic: { ...DEFAULT_SETTINGS.cinematic },
});

describe('constructCinematicPrompt', () => {
  it('includes the base prompt and default quality tags', () => {
    const out = constructCinematicPrompt('a cat', baseSettings());
    expect(out.startsWith('a cat')).toBe(true);
    expect(out).toContain('8k resolution');
    expect(out).toContain('masterpiece');
    expect(out).toContain('50mm lens'); // default focal length
  });

  it('adds the camera body when not AI default', () => {
    const s = baseSettings();
    s.cinematic.cameraType = CameraType.LEICA;
    expect(constructCinematicPrompt('x', s)).toContain(`shot on ${CameraType.LEICA}`);
  });

  it('translates aperture into depth-of-field cues', () => {
    const wide = baseSettings();
    wide.cinematic.aperture = Aperture.WIDE;
    expect(constructCinematicPrompt('x', wide)).toContain('creamy bokeh');

    const deep = baseSettings();
    deep.cinematic.aperture = Aperture.DEEP;
    expect(constructCinematicPrompt('x', deep)).toContain('everything in sharp focus');
  });

  it('adds focus-target descriptors', () => {
    const s = baseSettings();
    s.cinematic.focus = FocusTarget.FACE;
    expect(constructCinematicPrompt('x', s)).toContain('portrait photography');
  });

  it('adds studio lighting cues', () => {
    const s = baseSettings();
    s.cinematic.lighting = LightingStyle.STUDIO;
    expect(constructCinematicPrompt('x', s)).toContain('3-point studio lighting');
  });

  it('appends consistency cues only when locked', () => {
    const off = baseSettings();
    expect(constructCinematicPrompt('x', off)).not.toContain('consistent face and features');

    const on = baseSettings();
    on.consistencyLock = true;
    expect(constructCinematicPrompt('x', on)).toContain('consistent face and features');
  });

  it('omits non-default angle only when changed', () => {
    const s = baseSettings();
    s.cinematic.angle = CameraAngle.LOW_ANGLE;
    expect(constructCinematicPrompt('x', s)).toContain(CameraAngle.LOW_ANGLE);
  });

  it('returns only the typed prompt when rawPromptOnly is on', () => {
    const s = baseSettings();
    s.rawPromptOnly = true;
    s.consistencyLock = true;
    s.cinematic.cameraType = CameraType.LEICA;
    s.cinematic.lighting = LightingStyle.STUDIO;

    const out = constructCinematicPrompt('  just my words  ', s);
    expect(out).toBe('just my words');
    expect(out).not.toContain('ultra-realistic');
    expect(out).not.toContain('award winning');
    expect(out).not.toContain('8k resolution');
    expect(out).not.toContain('shot on');
    expect(out).not.toContain('consistent face');
  });
});
