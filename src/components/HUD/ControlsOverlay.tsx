import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Keyboard } from 'lucide-react';

interface ControlsOverlayProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ isMuted, onToggleMute }) => {
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-20 pointer-events-auto">
      {/* Help / Controls button */}
      <div className="relative">
        <button
          onClick={() => setShowControls(!showControls)}
          className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all shadow-xl ${
            showControls
              ? 'bg-sky-500/30 border-sky-400 text-sky-300'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500'
          }`}
          title="Game Controls & Keybinds"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Controls Popover */}
        {showControls && (
          <div className="absolute right-0 top-12 w-72 bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white text-xs animate-fade-in">
            <div className="flex items-center gap-2 font-black text-sm text-sky-400 pb-2 border-b border-slate-700 mb-2.5">
              <Keyboard className="w-4 h-4" />
              CONTROLS & SHORTCUTS
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Move Player</span>
                <span className="font-mono font-bold text-amber-300">WASD / Arrows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Aim & Attack / Mine</span>
                <span className="font-mono font-bold text-amber-300">Mouse + Left-Click</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hotbar Selection</span>
                <span className="font-mono font-bold text-amber-300">[1] - [9]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shop (Weapons & Armor)</span>
                <span className="font-mono font-bold text-amber-300">[B]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quick Repair Nearby</span>
                <span className="font-mono font-bold text-amber-300">[R]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Upgrade Selected / All</span>
                <span className="font-mono font-bold text-amber-300">[E]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Drink Health Potion</span>
                <span className="font-mono font-bold text-amber-300">[F]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Toggle Mute Audio</span>
                <span className="font-mono font-bold text-amber-300">[M]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cancel / Deselect</span>
                <span className="font-mono font-bold text-amber-300">[Esc] / Right-Click</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio Mute/Unmute Button */}
      <button
        onClick={onToggleMute}
        className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all shadow-xl ${
          isMuted
            ? 'bg-rose-950/60 border-rose-800 text-rose-400'
            : 'bg-slate-900/80 border-slate-700/80 text-emerald-400 hover:border-emerald-500'
        }`}
        title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
};
