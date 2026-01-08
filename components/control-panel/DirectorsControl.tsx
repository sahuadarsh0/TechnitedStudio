
import React, { useState } from 'react';
import { CinematicSettings, CameraType, LightingStyle, CameraAngle, FocusTarget } from '../../types';
import { CAMERA_TYPES, LIGHTING_STYLES, CAMERA_ANGLES, FOCAL_LENGTHS, FOCUS_TARGETS } from '../../constants';
import { CameraIcon, ChevronDownIcon, SettingsIcon, EyeIcon, BoltIcon } from '../Icons';

interface DirectorsControlProps {
  settings: CinematicSettings;
  onChange: (settings: CinematicSettings) => void;
}

type DirectorTab = 'gear' | 'scene' | 'film';

export const DirectorsControl: React.FC<DirectorsControlProps> = ({ settings, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DirectorTab>('gear');

  const update = <K extends keyof CinematicSettings>(key: K, value: CinematicSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const updateDetail = (key: keyof CinematicSettings['details'], value: boolean) => {
    onChange({
      ...settings,
      details: { ...settings.details, [key]: value }
    });
  };

  // Helper: Count active settings per tab to show indicators
  const getActiveCount = (tab: DirectorTab) => {
    let count = 0;
    if (tab === 'gear') {
      if (settings.cameraType !== CameraType.NONE) count++;
      if (settings.focalLength !== '50mm') count++; // Assuming 50mm is default neutral
    }
    if (tab === 'scene') {
      if (settings.angle !== CameraAngle.EYE_LEVEL) count++;
      if (settings.focus !== FocusTarget.NONE) count++;
      if (settings.lighting !== LightingStyle.NONE) count++;
    }
    if (tab === 'film') {
      if (settings.zoomDetail) count++;
      if (settings.details.pores) count++;
      if (settings.details.eyeReflections) count++;
    }
    return count;
  };

  const totalActive = getActiveCount('gear') + getActiveCount('scene') + getActiveCount('film');

  return (
    <section className="relative z-10 border-t border-white/5 pt-4 mt-2">
      {/* Accordion Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group ${
          isOpen || totalActive > 0
          ? 'bg-gradient-to-r from-laserBlue/10 to-transparent border-laserBlue/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
          : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
        }`}
        title="Open Director's Engine to fine-tune camera, lighting, and fidelity settings"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full transition-colors ${isOpen || totalActive > 0 ? 'bg-laserBlue text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
             <CameraIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start">
             <span className={`text-xs font-bold uppercase tracking-widest ${isOpen || totalActive > 0 ? 'text-white' : 'text-gray-400'}`}>
                Director's Engine
             </span>
             {(totalActive > 0 && !isOpen) && (
                <span className="text-[9px] font-mono text-laserBlue flex items-center gap-1 animate-pulse">
                   ● {totalActive} ACTIVE OVERRIDES
                </span>
             )}
          </div>
        </div>
        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-gray-500'}`} />
      </button>

      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
        <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
            
            {/* TABS HEADER */}
            <div className="flex border-b border-white/5">
                {[
                    { id: 'gear', label: 'Gear', icon: <SettingsIcon className="w-3 h-3"/>, desc: "Camera Body & Lens" },
                    { id: 'scene', label: 'Scene', icon: <CameraIcon className="w-3 h-3"/>, desc: "Composition & Lighting" },
                    { id: 'film', label: 'Film', icon: <EyeIcon className="w-3 h-3"/>, desc: "Texture & Fidelity" }
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const count = getActiveCount(tab.id as DirectorTab);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as DirectorTab)}
                            title={tab.desc}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative ${
                                isActive ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {count > 0 && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-laserBlue shadow-[0_0_5px_#00f0ff]' : 'bg-gray-600'}`}></span>
                            )}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-laserBlue shadow-[0_0_10px_#00f0ff]"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT AREA */}
            <div className="p-4 min-h-[280px]">
                
                {/* --- TAB 1: GEAR (Hardware) --- */}
                {activeTab === 'gear' && (
                    <div className="space-y-5 animate-fadeIn">
                        {/* Camera Body */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block" title="Choose the virtual camera system to emulate specific sensor characteristics and color science.">
                                Optical System
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                <select 
                                    value={settings.cameraType}
                                    onChange={(e) => update('cameraType', e.target.value as CameraType)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:border-laserBlue/50 focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors font-mono"
                                    title="Simulate the look of specific camera sensors (e.g., Leica color science, Analog Film grain, Sony sharpness)."
                                >
                                    {CAMERA_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Lens Selection */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block" title="Select the lens millimeter to control field of view and compression.">
                                    Focal Length
                                </label>
                                <span className="text-[9px] font-mono text-laserBlue">{settings.focalLength}</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1.5">
                                {FOCAL_LENGTHS.map(fl => {
                                    const isSelected = settings.focalLength === fl;
                                    return (
                                        <button
                                            key={fl}
                                            onClick={() => update('focalLength', fl)}
                                            title={
                                              fl === "16mm" ? "Ultra-wide. Distorts edges, expands space. Great for architecture/action." :
                                              fl === "35mm" ? "Standard wide. Classic cinematic documentary look." :
                                              fl === "50mm" ? "Human eye view. Natural distortion." :
                                              fl === "85mm" ? "Portrait lens. Flattering compression, good bokeh." :
                                              "Telephoto. Compresses background, isolates subject."
                                            }
                                            className={`py-2 rounded text-[9px] font-mono transition-all border ${
                                                isSelected 
                                                ? 'bg-laserBlue/20 border-laserBlue text-white shadow-neon' 
                                                : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20 hover:text-white'
                                            }`}
                                        >
                                            {fl.replace('mm', '')}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-600 px-1 font-mono uppercase">
                                <span>Wide / Action</span>
                                <span>Tele / Portrait</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: SCENE (Composition & Light) --- */}
                {activeTab === 'scene' && (
                    <div className="space-y-5 animate-fadeIn">
                        {/* Lighting - The most impactful setting */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2" title="Set the primary lighting setup and mood for the scene.">
                                <BoltIcon className="w-3 h-3"/> Lighting Atmosphere
                            </label>
                            <select 
                                value={settings.lighting}
                                onChange={(e) => update('lighting', e.target.value as LightingStyle)}
                                className={`w-full bg-black/40 border rounded-lg px-3 py-2.5 text-xs focus:border-laserBlue/50 focus:outline-none appearance-none hover:bg-white/5 transition-colors font-mono ${
                                    settings.lighting !== LightingStyle.NONE ? 'text-laserBlue border-laserBlue/30 font-bold shadow-[inset_0_0_10px_rgba(0,240,255,0.1)]' : 'text-gray-300 border-white/10'
                                }`}
                                title="Choose from Studio (perfectly lit), Cinematic (dramatic shadows), or stylistic presets."
                            >
                                {LIGHTING_STYLES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Angle */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest" title="The vertical position of the camera relative to the subject.">Angle</label>
                                <select 
                                    value={settings.angle}
                                    onChange={(e) => update('angle', e.target.value as CameraAngle)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px] text-gray-300 focus:border-laserBlue/50 focus:outline-none appearance-none hover:bg-white/5 transition-colors"
                                    title="Low Angle (Heroic), High Angle (Vulnerable), or standard Eye Level."
                                >
                                    {CAMERA_ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            {/* Focus */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest" title="Tell the camera explicitly what to keep sharp.">Focus Point</label>
                                <select 
                                    value={settings.focus}
                                    onChange={(e) => update('focus', e.target.value as FocusTarget)}
                                    className={`w-full bg-black/40 border rounded-lg px-2 py-2 text-[11px] focus:border-laserBlue/50 focus:outline-none appearance-none hover:bg-white/5 transition-colors ${
                                        settings.focus !== FocusTarget.NONE ? 'text-laserBlue border-laserBlue/30' : 'text-gray-300 border-white/10'
                                    }`}
                                    title="Prioritize sharpness on Face, Product, or Background (controlling depth of field)."
                                >
                                    {FOCUS_TARGETS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 3: FILM (Details & Texture) --- */}
                {activeTab === 'film' && (
                    <div className="space-y-4 animate-fadeIn">
                         <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2" title="Fine-tune the texture density and micro-details of the generation.">
                             Texture & Fidelity
                         </label>
                         
                         <div className="grid grid-cols-1 gap-2">
                            {/* Hyper Zoom Toggle */}
                            <button
                                onClick={() => update('zoomDetail', !settings.zoomDetail)}
                                title="Enables extreme macro photography mode with ultra-sharp textures."
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                    settings.zoomDetail 
                                    ? 'bg-laserPurple/10 border-laserPurple text-white shadow-[0_0_10px_rgba(112,0,255,0.2)]' 
                                    : 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5'
                                }`}
                            >
                                <div className="text-left">
                                    <span className="text-[11px] font-bold uppercase tracking-wider block">Macro Detail</span>
                                    <span className="text-[9px] font-mono opacity-60">Maximize texture density</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full border ${settings.zoomDetail ? 'bg-laserPurple border-laserPurple' : 'border-gray-600'}`}></div>
                            </button>

                            {/* Grid of Micro-Details */}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                    onClick={() => updateDetail('pores', !settings.details.pores)}
                                    title="Adds natural high-frequency skin texture, including visible pores and subsurface scattering."
                                    className={`py-3 px-1 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                                        settings.details.pores 
                                        ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.2)]' 
                                        : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <span className="text-[9px] font-bold uppercase">Skin Pores</span>
                                    <div className={`w-8 h-0.5 rounded-full ${settings.details.pores ? 'bg-pink-500' : 'bg-gray-700'}`}></div>
                                </button>

                                <button
                                    onClick={() => updateDetail('eyeReflections', !settings.details.eyeReflections)}
                                    title="Enhances the eyes with sharp iris details and realistic corneal reflections (catchlights)."
                                    className={`py-3 px-1 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                                        settings.details.eyeReflections 
                                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                                        : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <span className="text-[9px] font-bold uppercase">Eye Clarity</span>
                                    <div className={`w-8 h-0.5 rounded-full ${settings.details.eyeReflections ? 'bg-cyan-500' : 'bg-gray-700'}`}></div>
                                </button>
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* RESET FOOTER - Only visible if changes exist */}
            {totalActive > 0 && (
                <div className="p-2 border-t border-white/5 bg-white/5">
                    <button 
                        onClick={() => onChange({
                            cameraType: CameraType.NONE,
                            focalLength: "50mm",
                            angle: CameraAngle.EYE_LEVEL,
                            lighting: LightingStyle.NONE,
                            focus: FocusTarget.NONE,
                            zoomDetail: false,
                            details: { pores: false, eyeReflections: false }
                        })}
                        title="Revert all Director's Engine settings to default."
                        className="w-full py-1.5 text-[9px] uppercase font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <SettingsIcon className="w-3 h-3" />
                        Reset All Director Settings
                    </button>
                </div>
            )}
        </div>
      </div>
    </section>
  );
};
