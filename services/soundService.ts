
// Simple synth for UI sounds using Web Audio API
// No external assets required

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        audioCtx = new Ctx();
      }
    } catch (e) {
      console.warn("AudioContext creation failed", e);
    }
  }
  return audioCtx;
};

export const playSound = (type: 'click' | 'start' | 'success' | 'error', enabled: boolean = true) => {
  if (!enabled) return;
  
  try {
    const ctx = getCtx();
    if (!ctx) return;
    
    // Ensure context is running (browsers suspend it until user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume().catch((e) => console.warn("Audio resume failed", e));
    }

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
        // High, short blip - Increased volume
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        
        gain.gain.setValueAtTime(0.15, t); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc.start(t);
        osc.stop(t + 0.1);
    } else if (type === 'start') {
        // Soft sweep up indicating "Processing"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.2);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.05); 
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        
        osc.start(t);
        osc.stop(t + 0.2);
    } else if (type === 'success') {
         // Major triad arpeggio (C5, E5, G5)
         const notes = [523.25, 659.25, 783.99]; 
         notes.forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.value = freq;
            
            const start = t + i * 0.08;
            g.gain.setValueAtTime(0, start);
            g.gain.linearRampToValueAtTime(0.15, start + 0.05); 
            g.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
            
            o.start(start);
            o.stop(start + 0.6);
         });
    } else if (type === 'error') {
        // System Failure / Error Tone
        // Descending sawtooth for a harsh, tech-fail sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.4);
        
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        
        osc.start(t);
        osc.stop(t + 0.4);
    }
  } catch (e) {
    console.warn("Sound playback prevented:", e);
  }
};
