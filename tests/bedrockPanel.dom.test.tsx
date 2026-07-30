import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import BedrockPanel from '../components/BedrockPanel';
import { BEDROCK_SERVICES } from '../bedrockCatalog';
import { BedrockModel, GeneratedImage } from '../types';

/**
 * Reproduces the "clicking Bedrock turns the screen white" report.
 *
 * A white screen means an uncaught throw during render unmounted the React
 * tree, so these tests assert the panel mounts and every one of the 13
 * services renders its parameter form without throwing.
 */

const IMAGE: GeneratedImage = {
  id: 'img-1',
  url: '',
  thumbnail: 'data:image/png;base64,iVBORw0KGgo=',
  prompt: 'a test panther in the dark',
  timestamp: Date.now(),
  status: 'completed',
  settings: {} as any,
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('BedrockPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <BedrockPanel
        isOpen={false}
        onClose={() => {}}
        image={null}
        imageSrc=""
        onRun={() => {}}
        onRequestKey={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('mounts the locked state when no key is stored', () => {
    render(
      <BedrockPanel
        isOpen
        onClose={() => {}}
        image={IMAGE}
        imageSrc=""
        onRun={() => {}}
        onRequestKey={() => {}}
      />
    );
    expect(screen.getByText(/Bedrock is locked/i)).toBeTruthy();
  });

  it('mounts the unlocked service list when a key IS stored', () => {
    localStorage.setItem('technited_bedrock_api_key', 'fake-bearer-key');
    render(
      <BedrockPanel
        isOpen
        onClose={() => {}}
        image={IMAGE}
        imageSrc="data:image/png;base64,iVBORw0KGgo="
        onRun={() => {}}
        onRequestKey={() => {}}
      />
    );
    // All 13 service buttons should be listed.
    for (const svc of BEDROCK_SERVICES) {
      expect(screen.getAllByText(svc.label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/Pick a service to begin/i)).toBeTruthy();
  });

  it('renders every service parameter form without throwing', () => {
    localStorage.setItem('technited_bedrock_api_key', 'fake-bearer-key');
    for (const svc of BEDROCK_SERVICES) {
      const { unmount, getAllByText } = render(
        <BedrockPanel
          isOpen
          onClose={() => {}}
          image={IMAGE}
          imageSrc="data:image/png;base64,iVBORw0KGgo="
          onRun={() => {}}
          onRequestKey={() => {}}
        />
      );
      // Selecting the service swaps in its dynamic parameter form. The label
      // can appear twice (sidebar button + detail heading), so take the first.
      const btn = getAllByText(svc.label)[0];
      expect(() => btn.click()).not.toThrow();
      unmount();
    }
  });

  it('has no z-index conflict with the InspectionModal that opens it', async () => {
    // The panel is opened FROM the inspection modal (z-100), so it must sit
    // above it or it renders behind an opaque backdrop and looks like a blank
    // screen.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'components/BedrockPanel.tsx'),
      'utf8'
    );
    const match = src.match(/fixed inset-0 z-\[(\d+)\]/);
    expect(match).toBeTruthy();
    const panelZ = Number(match![1]);
    expect(panelZ).toBeGreaterThan(100);
  });

  it('survives an isOpen toggle without a hook-order crash', () => {
    // Regression: the component had `if (!isOpen) return null;` sitting ABOVE a
    // useMemo, so reopening it ran a different number of hooks and React threw
    // "Rendered more hooks than during the previous render", blanking the page.
    localStorage.setItem('technited_bedrock_api_key', 'fake-bearer-key');
    const props = {
      onClose: () => {},
      image: IMAGE,
      imageSrc: 'data:image/png;base64,iVBORw0KGgo=',
      onRun: () => {},
      onRequestKey: () => {},
    };
    const { rerender } = render(<BedrockPanel isOpen={false} {...props} />);
    // closed -> open -> closed -> open must not throw
    expect(() => {
      rerender(<BedrockPanel isOpen {...props} />);
      rerender(<BedrockPanel isOpen={false} {...props} />);
      rerender(<BedrockPanel isOpen {...props} />);
    }).not.toThrow();
    expect(screen.getAllByText('Fast Upscale').length).toBeGreaterThan(0);
  });

  it('calls every hook before the isOpen early return', async () => {
    // Static guard: no hook may appear after the `if (!isOpen) return null;`
    // line in the component body.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'components/BedrockPanel.tsx'),
      'utf8'
    );
    const lines = src.split('\n');
    const retIdx = lines.findIndex((l) => /^\s{2}if \(!isOpen\) return null;/.test(l));
    expect(retIdx).toBeGreaterThan(-1);
    const hookAfter = lines
      .slice(retIdx)
      .findIndex((l) => /\buse(State|Memo|Effect|Callback|Ref|Reducer)\s*\(/.test(l));
    expect(hookAfter).toBe(-1);
  });
});
